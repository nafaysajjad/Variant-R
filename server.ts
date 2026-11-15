// server.ts — Express HTTP server for Variant-R (port 3000)
// Serves Vite middleware in dev, dist/ in production, and AI endpoints powered by Gemini.

import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { buildDeterministicBrief } from './js/forecast.js';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const CACHE_TTL_MS = 10 * 60 * 1000;
const aiCache = new Map<string, { ts: number; data: unknown }>();

const FORECAST_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: 'Clear 8-12 word headline in plain English naming region and year' },
    riskOutlook: { type: Type.STRING, description: '2 clear, easy-to-read sentences comparing past peak years to the selected dry-weather stress test' },
    priorityZones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          region: { type: Type.STRING },
          riskLevel: { type: Type.STRING, description: 'One of: Extreme, High, Elevated' },
          driver: { type: Type.STRING, description: 'Simple 5-8 word wildfire cause' },
        },
        required: ['region', 'riskLevel', 'driver'],
      },
    },
    smokeNote: { type: Type.STRING, description: 'One plain-English sentence on downwind PM2.5 smoke haze and air quality' },
  },
  required: ['headline', 'riskOutlook', 'priorityZones', 'smokeNote'],
};

const ASK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING, description: '2-4 crisp, easy-to-understand sentences answering the user by searching the 25-year table, 3-country comparison, top forests, pollutants, or active local pin. Plain prose without markdown bullets.' },
    takeaway: { type: Type.STRING, description: 'Short 6-10 word bottom-line finding' },
    suggestedScenario: {
      type: Type.OBJECT,
      nullable: true,
      description: 'Populate ONLY if the user asks to compare/switch country, jump to a year, switch metric, test warming stress, or view predicted zones on the map.',
      properties: {
        countryId: { type: Type.STRING, description: 'One of canada, usa, or russia if switching country is helpful' },
        horizonYear: { type: Type.INTEGER, description: 'One of 2027, 2030, or 2035 if relevant' },
        warmingPct: { type: Type.INTEGER, description: 'Multiple of 5 from 0 to 40 if relevant' },
        showPredictedOverlay: { type: Type.BOOLEAN, description: 'Set true if user asks to show predicted zones on the map' },
        focusYear: { type: Type.INTEGER, description: 'Year 2002-2026 if recommending inspecting a specific past year' },
        focus: { type: Type.STRING, description: 'Optional variable id: fire_frp, fire_count, viirs_count, co2_em, or pm25_em' },
      },
    },
  },
  required: ['answer', 'takeaway'],
};

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

async function generateWithTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '96kb' }));

  app.post('/api/forecast', async (req, res) => {
    const body = req.body || {};
    const scopePath = String(body.scopePath || 'usa');
    const horizonYear = Number(body.horizonYear) || 2030;
    const warmingPct = Number(body.warmingPct) || 15;
    const forceRefresh = Boolean(body.forceRefresh);
    const cacheKey = `${scopePath}|${horizonYear}|${Math.round(warmingPct / 5) * 5}`;

    const cached = !forceRefresh ? aiCache.get(cacheKey) : null;
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const fallbackBrief = buildDeterministicBrief({
      scopePath,
      countryName: String(body.countryName || scopePath.toUpperCase()),
      horizonYear,
      warmingPct,
      projectedFrpPct: Number(body.projectedFrpPct) || 0,
      projectedCo2Pct: Number(body.projectedCo2Pct) || 0,
      plumeRiskScore: Number(body.plumeRiskScore) || 50,
      plumeTier: String(body.plumeTier || 'Moderate'),
      topZones: Array.isArray(body.topZones) ? body.topZones : [],
    });

    const ai = getClient();
    if (!ai) {
      return res.json({ source: 'statistical-model', fallback: true, brief: fallbackBrief });
    }

    const zonesText = Array.isArray(body.topZones)
      ? body.topZones.slice(0, 4).map((z: { region?: string; deltaPct?: number; tier?: string }) =>
          `${z.region} (+${z.deltaPct}% risk, tier: ${z.tier})`).join('; ')
      : scopePath;

    const peaks = Array.isArray(body.peakCo2Years)
      ? body.peakCo2Years.map((p: { year?: number; co2Mt?: number; topRegion?: string }) =>
          `${p.year}: ${p.co2Mt} Mt CO2 (${p.topRegion})`).join('; ')
      : '';

    const prompt = [
      'You write clear, plain-English wildfire forecast summaries for Variant-R.',
      `Country: ${body.countryName || scopePath}. Scenario: Horizon=${horizonYear}, Dry-Weather Stress=+${warmingPct}%.`,
      `Model output: Fire heat change=+${body.projectedFrpPct}% vs typical year; Smoke CO2 change=+${body.projectedCo2Pct}%; Smoke Haze Score=${body.plumeRiskScore}/100 (${body.plumeTier}).`,
      peaks ? `Biggest historical carbon years: ${peaks}.` : '',
      `Top fire-prone regions: ${zonesText}.`,
      'Use only these facts without inventing outside statistics. Keep wording simple, direct, and easy for everyday readers to understand.',
    ].filter(Boolean).join('\n');

    try {
      const response = await generateWithTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: FORECAST_SCHEMA,
        },
      }));
      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini API');
      const brief = JSON.parse(text);
      const result = { source: 'gemini-4-hydrogen', fallback: false, brief };
      if (aiCache.size >= 64) {
        const oldest = aiCache.keys().next().value;
        if (oldest) aiCache.delete(oldest);
      }
      aiCache.set(cacheKey, { ts: Date.now(), data: result });
      return res.json(result);
    } catch (err) {
      console.warn('POST /api/forecast Gemini fallback:', err instanceof Error ? err.message : err);
      return res.json({ source: 'statistical-model', fallback: true, brief: fallbackBrief });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve('dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Variant-R server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
