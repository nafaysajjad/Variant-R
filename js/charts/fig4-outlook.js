// js/charts/fig4-outlook.js
// Purpose: Wildfire Outlook (#outlook) — 2027-2035 scenario forecast and Methodology & Data Used tab.

import {
  HORIZONS,
  buildDeterministicBrief,
  computeForecast,
  computeLocalFireRisk,
  summarizeScopeContext,
} from '../forecast.js';

const STYLE = `
.f4-root { padding: 14px 18px 14px; display: flex; flex-direction: column; gap: 12px; }
.f4-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 14px; }
.f4-title-wrap { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.f4-title { font-family: var(--f-serif); font-size: 17px; font-weight: 700; letter-spacing: -0.01em; margin: 0; color: var(--c-ink); }
.f4-sub { font-family: var(--f-mono); font-size: 11px; color: var(--c-muted); font-variant-numeric: tabular-nums; }
.f4-head-right { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

.f4-view-tabs {
  display: inline-flex; padding: 2px; gap: 2px;
  background: var(--c-panel); border: 1px solid var(--c-edge); border-radius: 7px;
}
.f4-view-tab {
  border: 1px solid transparent; border-radius: 5px; padding: 4px 11px;
  font-family: var(--f-sans); font-size: 12px; font-weight: 600;
  color: var(--c-muted); background: transparent; line-height: 1.25;
}
.f4-view-tab:hover:not([aria-selected="true"]) { color: var(--c-ink); background: rgba(255, 255, 255, 0.75); }
.f4-view-tab[aria-selected="true"] {
  color: var(--c-ink); background: var(--c-paper); border-color: var(--c-edge-hover);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.f4-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.f4-seg {
  display: inline-flex; padding: 2px; gap: 2px;
  background: var(--c-panel); border: 1px solid var(--c-edge); border-radius: 6px;
}
.f4-seg button {
  border: 1px solid transparent; border-radius: 4px; padding: 3px 9px;
  font-family: var(--f-mono); font-size: 11.5px; font-weight: 600;
  color: var(--c-muted); background: transparent; line-height: 1.25;
}
.f4-seg button[aria-pressed="true"] {
  color: var(--c-ink); background: var(--c-paper); border-color: var(--c-edge-hover);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.f4-btn {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid var(--c-edge); border-radius: 6px; padding: 4px 10px;
  font-size: 11.5px; font-weight: 600; color: var(--c-ink); background: var(--c-paper);
  line-height: 1.25;
}
.f4-btn[aria-pressed="true"] {
  border-color: #6A3093; color: #FFFFFF; background: #6A3093;
}
.f4-btn--ghost { color: var(--c-muted); background: var(--c-panel); }
.f4-btn--ghost:hover:not([disabled]) { color: var(--c-ink); }
.f4-btn[disabled] { opacity: 0.72; cursor: wait; }

.f4-tab-pane[hidden] { display: none; }
.f4-forecast-pane { display: flex; flex-direction: column; gap: 11px; }

.f4-scenario {
  display: grid; grid-template-columns: minmax(0, 1.35fr) repeat(3, minmax(0, 1fr)); gap: 8px;
  padding: 9px 11px; background: var(--c-panel); border: 1px solid var(--c-edge); border-radius: 6px;
  align-items: center;
}
.f4-slider-wrap { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding-right: 6px; }
.f4-slider-head { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; font-size: 11px; }
.f4-slider-lbl { font-weight: 600; color: var(--c-ink); }
.f4-slider-val { font-family: var(--f-mono); font-weight: 700; color: #B45309; font-variant-numeric: tabular-nums; }
.f4-range { width: 100%; accent-color: #6A3093; margin: 0; cursor: pointer; }
.f4-kpi {
  background: var(--c-paper); border: 1px solid var(--c-edge); border-radius: 5px;
  padding: 5px 8px; min-width: 0;
}
.f4-kpi-k { display: block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--c-muted); }
.f4-kpi-v { display: block; font-family: var(--f-mono); font-size: 13.5px; font-weight: 700; color: var(--c-ink); font-variant-numeric: tabular-nums; }
.f4-kpi-v.is-purple { color: #6A3093; }
.f4-kpi-v.is-warn { color: #B45309; }

.f4-grid { display: grid; grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr); gap: 12px; align-items: stretch; }
.f4-panel {
  border: 1px solid var(--c-edge); border-radius: 6px; background: var(--c-paper);
  padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; min-width: 0;
}
.f4-panel-head {
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
  padding-bottom: 6px; border-bottom: 1px solid var(--c-edge);
}
.f4-panel-title { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-ink); }
.f4-panel-meta { display: inline-flex; align-items: center; gap: 5px; font-family: var(--f-mono); font-size: 10px; color: var(--c-muted); }
.f4-svg { display: block; width: 100%; height: auto; }
.f4-zones { display: flex; flex-direction: column; gap: 5px; }
.f4-zone { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 8px; align-items: center; font-size: 11.5px; }
.f4-zone-name { font-weight: 600; color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.f4-zone-meta { font-family: var(--f-mono); font-size: 10.5px; font-variant-numeric: tabular-nums; color: #6A3093; font-weight: 700; }
.f4-zone-bar { grid-column: 1 / -1; height: 4px; border-radius: 2px; background: #E2E8F0; overflow: hidden; }
.f4-zone-fill { height: 100%; background: linear-gradient(90deg, #6A3093, #D55E00); border-radius: 2px; }

.f4-ai-head { margin: 0; font-family: var(--f-serif); font-size: 14.5px; font-weight: 700; color: var(--c-ink); line-height: 1.3; }
.f4-ai-body { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--c-ink); }
.f4-ai-drivers { display: flex; flex-direction: column; gap: 4px; }
.f4-driver {
  font-size: 11px; line-height: 1.35; padding: 4px 7px;
  border: 1px solid var(--c-edge); border-radius: 4px; background: var(--c-panel); color: var(--c-ink);
}
.f4-driver strong { color: #6A3093; font-family: var(--f-mono); font-size: 10.5px; }
.f4-ai-smoke { margin: 0; padding-top: 5px; border-top: 1px dashed var(--c-edge); font-size: 11.5px; line-height: 1.42; color: var(--c-muted); }
.f4-ai-smoke strong { color: var(--c-ink); }

/* Standout Ask AI Search Card */
.f4-ask-card {
  margin-top: 2px;
  border: 1.5px solid #C4B5FD;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(106, 48, 147, 0.055) 0%, rgba(213, 94, 0, 0.04) 100%);
  padding: 11px 13px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 10px rgba(106, 48, 147, 0.07);
}
.f4-ask-top {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px;
}
.f4-ask-brand { display: inline-flex; align-items: center; gap: 7px; }
.f4-ask-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 6px;
  background: linear-gradient(135deg, #6A3093, #D55E00); color: #FFFFFF;
}
.f4-ask-title { font-family: var(--f-serif); font-size: 14.5px; font-weight: 700; color: var(--c-ink); margin: 0; }
.f4-ask-tag {
  font-family: var(--f-mono); font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 4px; background: rgba(106, 48, 147, 0.12); color: #581C87;
}
.f4-prompts { display: flex; flex-wrap: wrap; gap: 5px; }
.f4-prompt-btn {
  padding: 3px 9px; border-radius: 5px; border: 1px solid #DDD6FE; background: var(--c-paper);
  font-family: var(--f-sans); font-size: 11px; font-weight: 600; color: #4C1D95;
  transition: background-color 140ms var(--ease-out), border-color 140ms var(--ease-out);
}
.f4-prompt-btn:hover { color: #FFFFFF; border-color: #6A3093; background: #6A3093; }
.f4-chat-log {
  max-height: 185px; overflow-y: auto; display: flex; flex-direction: column; gap: 7px;
  padding: 8px 10px; background: var(--c-paper); border: 1px solid var(--c-edge); border-radius: 6px;
}
.f4-chat-log[hidden] { display: none; }
.f4-msg { display: flex; flex-direction: column; gap: 3px; font-size: 12px; line-height: 1.46; }
.f4-msg + .f4-msg { padding-top: 7px; border-top: 1px dashed var(--c-edge); }
.f4-msg-q { font-family: var(--f-mono); font-size: 11px; font-weight: 700; color: #6A3093; }
.f4-msg-a { color: var(--c-ink); }
.f4-msg-meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; font-family: var(--f-mono); font-size: 10px; color: var(--c-muted); }
.f4-apply-btn {
  padding: 2px 8px; border-radius: 4px; border: 1px solid #6A3093; background: #6A3093;
  color: #FFFFFF; font-family: var(--f-mono); font-size: 10px; font-weight: 600;
}
.f4-ask-form { display: flex; gap: 7px; align-items: stretch; }
.f4-ask-input {
  flex: 1 1 auto; min-width: 0; padding: 7px 11px; border: 1.5px solid #CBD5E1; border-radius: 6px;
  background: var(--c-paper); font-family: var(--f-sans); font-size: 12.5px; color: var(--c-ink);
}
.f4-ask-input:focus { outline: 2px solid #6A3093; outline-offset: -1px; border-color: #6A3093; }
.f4-ask-submit {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  flex: 0 0 auto; padding: 7px 15px; border-radius: 6px; border: 1px solid #6A3093;
  background: linear-gradient(135deg, #6A3093, #5B21B6); color: #FFFFFF; font-size: 12.5px; font-weight: 700;
  box-shadow: 0 2px 6px rgba(106, 48, 147, 0.22);
}
.f4-ask-submit:hover:not([disabled]) { filter: brightness(1.06); }
.f4-ask-submit[disabled] { opacity: 0.78; cursor: wait; }

/* Methodology & Data Used Tab */
.f4-meth-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.f4-meth-card {
  border: 1px solid var(--c-edge); border-radius: 6px; background: var(--c-panel);
  padding: 11px 13px; display: flex; flex-direction: column; gap: 6px; min-width: 0;
}
.f4-meth-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.f4-meth-title { font-family: var(--f-serif); font-size: 14px; font-weight: 700; color: var(--c-ink); margin: 0; }
.f4-meth-badge {
  font-family: var(--f-mono); font-size: 10px; font-weight: 700; color: #6A3093;
  background: rgba(106, 48, 147, 0.09); border-radius: 4px; padding: 2px 6px; white-space: nowrap;
}
.f4-meth-body { margin: 0; font-size: 12px; line-height: 1.5; color: var(--c-ink); }
.f4-meth-list { margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 3px; font-size: 11.5px; line-height: 1.44; color: var(--c-muted); }
.f4-meth-list strong { color: var(--c-ink); }
.f4-meth-formula {
  font-family: var(--f-mono); font-size: 11px; color: var(--c-ink);
  background: var(--c-paper); border: 1px solid var(--c-edge); border-radius: 4px;
  padding: 6px 8px; overflow-x: auto;
}

.f4-cap { font-size: 11.5px; font-style: italic; color: var(--c-muted); margin: 0; }

@media (max-width: 899px) {
  .f4-scenario { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .f4-slider-wrap { grid-column: 1 / -1; }
  .f4-grid, .f4-meth-grid { grid-template-columns: 1fr; }
}
`;

const NS = 'http://www.w3.org/2000/svg';
const SPARK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.8L19.5 11l-5.6 2.2L12 19l-1.9-5.8L4.5 11l5.6-2.2z"/></svg>';

function renderTrajectorySvg(forecast, fmtCompactTick) {
  const pts = forecast.trajectory || [];
  if (!pts.length) return '';
  const W = 350;
  const H = 104;
  const ml = 36;
  const mr = 14;
  const mt = 10;
  const mb = 20;
  const maxVal = Math.max(...pts.map((p) => p.high || p.value || 1)) * 1.08;
  const minYr = pts[0].year;
  const maxYr = pts[pts.length - 1].year;
  const x = (yr) => ml + ((yr - minYr) / Math.max(1, maxYr - minYr)) * (W - ml - mr);
  const y = (v) => mt + (1 - v / maxVal) * (H - mt - mb);

  const hist = pts.filter((p) => p.kind === 'historical');
  const proj = pts.filter((p) => p.kind === 'projected');
  const bridge = hist.length && proj.length ? [hist[hist.length - 1], ...proj] : proj;

  const fanPts = bridge.length > 1
    ? [
        ...bridge.map((p) => `${x(p.year).toFixed(1)},${y(p.high).toFixed(1)}`),
        ...bridge.slice().reverse().map((p) => `${x(p.year).toFixed(1)},${y(p.low).toFixed(1)}`),
      ].join(' ')
    : '';

  const lineOf = (arr) => arr.map((p) => `${x(p.year).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const activePt = proj.find((p) => p.year === forecast.horizonYear) || proj[proj.length - 1];

  return `<svg class="f4-svg" viewBox="0 0 ${W} ${H}" xmlns="${NS}" role="img" aria-label="Historical to ${forecast.horizonYear} fire heat projection">
    <line x1="${ml}" y1="${mt}" x2="${ml}" y2="${H - mb}" stroke="#D0D7DE"/>
    <line x1="${ml}" y1="${H - mb}" x2="${W - mr}" y2="${H - mb}" stroke="#D0D7DE"/>
    <line x1="${x(2025).toFixed(1)}" y1="${mt}" x2="${x(2025).toFixed(1)}" y2="${H - mb}" stroke="#94A3B8" stroke-dasharray="3 3"/>
    ${fanPts ? `<polygon points="${fanPts}" fill="rgba(106, 48, 147, 0.14)"/>` : ''}
    ${hist.length > 1 ? `<polyline fill="none" stroke="#1A1D21" stroke-width="1.6" points="${lineOf(hist)}"/>` : ''}
    ${bridge.length > 1 ? `<polyline fill="none" stroke="#6A3093" stroke-width="2" stroke-dasharray="4 2" points="${lineOf(bridge)}"/>` : ''}
    ${proj.map((p) => `<circle cx="${x(p.year).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="${p === activePt ? 4 : 2.6}" fill="${p === activePt ? '#6A3093' : '#FFFFFF'}" stroke="#6A3093" stroke-width="1.6"/>`).join('')}
    <text x="${ml - 4}" y="${mt + 4}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="8.5" fill="#54595D">${fmtCompactTick(Math.round(maxVal))}</text>
    <text x="${ml - 4}" y="${H - mb}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="8.5" fill="#54595D">0</text>
    <text x="${x(minYr).toFixed(1)}" y="${H - 5}" text-anchor="start" font-family="IBM Plex Mono, monospace" font-size="9" fill="#54595D">${minYr}</text>
    <text x="${x(2025).toFixed(1)}" y="${H - 5}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" fill="#54595D">2025</text>
    <text x="${x(maxYr).toFixed(1)}" y="${H - 5}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="700" fill="#6A3093">${maxYr}</text>
  </svg>`;
}

export async function mount(el, ctx) {
  const { store, data, theme } = ctx;
  const { injectCss, escHtml, fmtCompact, fmtCompactTick, fmtMass, spinner } = theme;
  injectCss('f4', STYLE);

  spinner(el, 'Loading forecast…');

  let activeTab = 'forecast';
  const root = document.createElement('div');
  root.className = 'f4-root';

  root.innerHTML = `
    <div class="f4-head">
      <div class="f4-title-wrap">
        <h3 class="f4-title">2027–2035 Wildfire Outlook</h3>
        <span class="f4-sub" data-ref="sub">Long-term fire trend + future dry-weather stress test</span>
      </div>
      <div class="f4-head-right">
        <div class="f4-view-tabs" role="tablist" aria-label="Outlook panels">
          <button type="button" class="f4-view-tab" role="tab" data-view="forecast" aria-selected="true">Forecast</button>
          <button type="button" class="f4-view-tab" role="tab" data-view="methodology" aria-selected="false">Methodology &amp; Data Used</button>
        </div>
      </div>
    </div>

    <div class="f4-tab-pane f4-forecast-pane" data-pane="forecast">
      <div class="f4-controls">
        <div class="f4-seg" role="group" aria-label="Forecast year">
          ${HORIZONS.map((y) => `<button type="button" data-horizon="${y}" aria-pressed="false">${y}</button>`).join('')}
        </div>
        <button type="button" class="f4-btn" data-ref="overlayBtn" aria-pressed="false">Show Predicted Zones</button>
        <button type="button" class="f4-btn f4-btn--ghost" data-ref="aiBtn"> </button>
      </div>
      <div class="f4-scenario">
        <label class="f4-slider-wrap">
          <span class="f4-slider-head">
            <span class="f4-slider-lbl">Dry-Weather Warming Stress</span>
            <span class="f4-slider-val" data-ref="stressVal">+15%</span>
          </span>
          <input class="f4-range" type="range" min="0" max="40" step="5" value="15" data-ref="stressInput" aria-label="Dry-weather warming stress percentage">
        </label>
        <div class="f4-kpi">
          <span class="f4-kpi-k">Future Fire Heat</span>
          <span class="f4-kpi-v is-warn" data-ref="kpiFrp">—</span>
        </div>
        <div class="f4-kpi">
          <span class="f4-kpi-k">Expected CO₂ Smoke</span>
          <span class="f4-kpi-v" data-ref="kpiCo2">—</span>
        </div>
        <div class="f4-kpi">
          <span class="f4-kpi-k">Smoke Haze Score</span>
          <span class="f4-kpi-v is-purple" data-ref="kpiRisk">—</span>
        </div>
      </div>
      <div class="f4-grid">
        <div class="f4-panel">
          <div class="f4-panel-head">
            <span class="f4-panel-title">Projected Path &amp; Top Regions</span>
            <span class="f4-panel-meta" data-ref="trajMeta">MW · range</span>
          </div>
          <div data-ref="trajChart"></div>
          <div class="f4-zones" data-ref="zones"></div>
        </div>
        <div class="f4-panel">
          <div class="f4-panel-head">
            <span class="f4-panel-title">Forecast Summary</span>
            <span class="f4-panel-meta" data-ref="aiSource">Trend model</span>
          </div>
          <h4 class="f4-ai-head" data-ref="aiHeadline">—</h4>
          <p class="f4-ai-body" data-ref="aiBody"></p>
          <div class="f4-ai-drivers" data-ref="aiDrivers"></div>
          <p class="f4-ai-smoke" data-ref="aiSmoke"></p>
        </div>
      </div>

      <p class="f4-cap" data-ref="cap"></p>
    </div>

    <div class="f4-tab-pane" data-pane="methodology" hidden data-ref="methodologyPane"></div>
  `;

  const ref = (name) => root.querySelector(`[data-ref="${name}"]`);
  const viewTabs = Array.from(root.querySelectorAll('.f4-view-tab'));
  const panes = Array.from(root.querySelectorAll('.f4-tab-pane'));
  const horizonBtns = Array.from(root.querySelectorAll('[data-horizon]'));
  const overlayBtn = ref('overlayBtn');
  const aiBtn = ref('aiBtn');
  const stressInput = ref('stressInput');
  const methodologyPane = ref('methodologyPane');

  function setTab(nextTab) {
    activeTab = nextTab;
    for (const t of viewTabs) t.setAttribute('aria-selected', String(t.dataset.view === activeTab));
    for (const p of panes) p.hidden = p.dataset.pane !== activeTab;
  }

  for (const t of viewTabs) {
    t.addEventListener('click', () => setTab(t.dataset.view));
  }
  for (const btn of horizonBtns) {
    btn.addEventListener('click', () => store.set({ horizonYear: Number(btn.dataset.horizon) }));
  }
  overlayBtn.addEventListener('click', () => store.set({ showPredictedOverlay: !store.get().showPredictedOverlay }));
  stressInput.addEventListener('input', () => store.set({ warmingPct: Number(stressInput.value) }));

  let scope = null;
  let lastForecast = null;
  let scopeToken = 0;
  let aiToken = 0;
  let debounceTimer = null;

  function renderMethodology(f) {
    if (!methodologyPane || !f) return;
    const sc = scope;
    const yrSpan = sc?.meta?.years ? `${sc.meta.years[0]}–${sc.meta.years[1]}` : '2002–2026';
    const forestCount = sc?.summary?.allForests?.length || 0;
    const senSign = f.senSlopePerYr >= 0 ? '+' : '−';

    methodologyPane.innerHTML = `
      <div class="f4-meth-grid">
        <div class="f4-meth-card">
          <div class="f4-meth-head">
            <h4 class="f4-meth-title">1. Data Files Used</h4>
            <span class="f4-meth-badge">2002–2026 Archives</span>
          </div>
          <p class="f4-meth-body">Every chart, map layer, and forecast for <strong>${escHtml(f.countryName)}</strong> uses real satellite and forest records (${yrSpan}):</p>
          <ul class="f4-meth-list">
            <li><strong>NASA MODIS (1 km):</strong> 2002–2026 fire counts, fire heat power (MW), day/night passes, and Terra/Aqua splits.</li>
            <li><strong>NASA VIIRS (375 m):</strong> High-detail 2012–2026 fire points and outage-day logs across <strong>${forestCount || '40+'}</strong> catalogued forests.</li>
            <li><strong>Copernicus CAMS GFAS:</strong> 2003–2026 smoke gas totals (CO₂, PM₂.₅, CH₄, CO, OC, BC, NOx, SO₂) by region and forest.</li>
          </ul>
        </div>

        <div class="f4-meth-card">
          <div class="f4-meth-head">
            <h4 class="f4-meth-title">2. Fast Spatial Grid Indexing</h4>
            <span class="f4-meth-badge">0.2° / 0.5° Grids</span>
          </div>
          <p class="f4-meth-body">Millions of satellite points are pre-grouped into compact map cells so scrubbing years and checking cities stays fast:</p>
          <ul class="f4-meth-list">
            <li><strong>Fire Cells (0.2°):</strong> Store fire count, total &amp; peak fire power (MW), dates, and forest/state names.</li>
            <li><strong>Smoke Cells (0.5°):</strong> Store PM₂.₅ smoke mass and CO₂ output for the map's smoke overlay.</li>
            <li><strong>Complete Yearly Summaries:</strong> All 25 annual totals, monthly series, and forest lists live in <code>scope-index.json</code>.</li>
          </ul>
        </div>

        <div class="f4-meth-card">
          <div class="f4-meth-head">
            <h4 class="f4-meth-title">3. 2027–2035 Forecast Formula</h4>
            <span class="f4-meth-badge">Trend + Dry Stress</span>
          </div>
          <p class="f4-meth-body">Future projections combine the 25-year fire-heat slope (ignoring partial 2026 YTD) with your chosen dry-weather stress:</p>
          <div class="f4-meth-formula">Yearly slope = ${senSign}${fmtCompact(Math.abs(f.senSlopePerYr))} MW/yr · Starting baseline = 55% Median + 45% Recent (2016–25)<br>Multiplier = 1 + max(0.015, relSlope + 0.011)×Δyrs + stress%×(0.95 + 0.055×Δyrs)</div>
          <ul class="f4-meth-list">
            <li><strong>Smoke Link:</strong> Future CO₂ rises from the median via <code>0.94 + 1.12 × (Multiplier − 1)</code>.</li>
            <li><strong>Top Regions:</strong> Ranked by recent 2016–2025 fire heat and smoke output.</li>
          </ul>
        </div>

        <div class="f4-meth-card">
          <div class="f4-meth-head">
            <h4 class="f4-meth-title">4. Realistic Local Fire &amp; Smoke Odds</h4>
            <span class="f4-meth-badge">Distance-Weighted</span>
          </div>
          <p class="f4-meth-body">Scanning all <strong>25 years of grids (2002–2026)</strong> inside 100 km separates close fire danger from distant smoke haze:</p>
          <div class="f4-meth-formula">Distance weights: &le;25 km = 1.0 · 25–55 km = 0.32 · 55–100 km = 0.07<br>Direct Fire Threat = 1%–55% (close fires &le;35 km) · Smoke Haze Odds = 8%–86% (100 km airshed)</div>
          <ul class="f4-meth-list">
            <li><strong>Why Personal Risk Stays Realistic:</strong> Far-off forest fires bring smoky skies without turning into fake high burn odds for your home.</li>
            <li><strong>Tailored Advice:</strong> Tips reference your exact town/pin, closest fire distance, nearest forest, and peak year.</li>
          </ul>
        </div>
      </div>
    `;
  }

  function renderBrief(brief, sourceLabel, isLoading = false) {
    const srcEl = ref('aiSource');
    srcEl.innerHTML = isLoading
      ? `<span class="vr-spinner vr-spinner--sm" aria-hidden="true"></span><span>${escHtml(sourceLabel)}</span>`
      : escHtml(sourceLabel);
    ref('aiHeadline').textContent = brief.headline;
    ref('aiBody').textContent = brief.riskOutlook;
    const driversEl = ref('aiDrivers');
    driversEl.innerHTML = (brief.priorityZones || []).slice(0, 3).map((z) =>
      `<div class="f4-driver"><strong>${escHtml(z.region)} · ${escHtml(z.riskLevel)}</strong> — ${escHtml(z.driver)}</div>`,
    ).join('');
    ref('aiSmoke').innerHTML = `<strong>Smoke note:</strong> ${escHtml(brief.smokeNote)}`;
  }

  async function requestAiBrief(forecast, forceLive = false) {
    const my = ++aiToken;
    ref('aiSource').innerHTML = `<span class="vr-spinner vr-spinner--sm" aria-hidden="true"></span><span>${forceLive ? 'Updating…' : 'Refreshing…'}</span>`;
    aiBtn.disabled = true;
    aiBtn.innerHTML = '<span class="vr-spinner vr-spinner--sm" aria-hidden="true"></span><span>Refreshing…</span>';
    const scCtx = summarizeScopeContext(scope, store.get().year);
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
    try {
      const res = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl ? ctrl.signal : undefined,
        body: JSON.stringify({
          scopePath: forecast.scopePath,
          countryName: forecast.countryName,
          horizonYear: forecast.horizonYear,
          warmingPct: forecast.warmingPct,
          projectedFrpPct: forecast.projectedFrpPct,
          projectedCo2Pct: forecast.projectedCo2Pct,
          plumeRiskScore: forecast.plumeRiskScore,
          plumeTier: forecast.plumeTier,
          topZones: forecast.topZones,
          peakCo2Years: scCtx.peakCo2Years,
          forceRefresh: forceLive,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (my !== aiToken) return;
      const srcLabel = json.fallback ? 'Trend summary' : 'Variant-R AI';
      if (json.brief) renderBrief(json.brief, srcLabel, false);
    } catch {
      if (my !== aiToken) return;
      renderBrief(buildDeterministicBrief(forecast), 'Trend summary', false);
    } finally {
      if (timer) clearTimeout(timer);
      if (my === aiToken) {
        aiBtn.disabled = false;
        aiBtn.textContent = '';
      }
    }
  }

  function renderForecast(state, fetchAi = false) {
    if (!scope || !scope.meta) return null;
    const hYear = Number(state.horizonYear) || 2030;
    const wPct = Number(state.warmingPct) ?? 15;
    for (const b of horizonBtns) b.setAttribute('aria-pressed', String(Number(b.dataset.horizon) === hYear));
    overlayBtn.setAttribute('aria-pressed', String(!!state.showPredictedOverlay));
    overlayBtn.textContent = state.showPredictedOverlay ? 'Hide Predicted Zones' : 'Show Predicted Zones';
    stressInput.value = String(wPct);
    ref('stressVal').textContent = `+${wPct}%`;

    const f = computeForecast({ scope, horizonYear: hYear, warmingPct: wPct });
    lastForecast = f;
    ref('sub').textContent = `${f.countryName} · ${f.horizonYear} outlook (+${f.warmingPct}% dry stress) · Slope ${f.senSlopePerYr >= 0 ? '+' : ''}${fmtCompact(f.senSlopePerYr)} MW/yr`;
    ref('kpiFrp').textContent = `${fmtCompact(f.projectedFrpMw)} MW (+${f.projectedFrpPct}%)`;
    ref('kpiCo2').textContent = `${fmtMass(f.projectedCo2Tonnes, 'Mt')} (+${f.projectedCo2Pct}%)`;
    ref('kpiRisk').textContent = `${f.plumeRiskScore}/100 · ${f.plumeTier}`;
    ref('trajMeta').textContent = `2018–${f.horizonYear} · +${f.projectedFrpPct}% vs typical`;
    ref('trajChart').innerHTML = renderTrajectorySvg(f, fmtCompactTick);

    const maxDelta = Math.max(1, ...f.topZones.map((z) => z.deltaPct));
    ref('zones').innerHTML = f.topZones.slice(0, 4).map((z) => {
      const w = Math.max(12, Math.round((z.deltaPct / maxDelta) * 100));
      return `<div class="f4-zone">
        <span class="f4-zone-name">${escHtml(z.region)}</span>
        <span class="f4-zone-meta">+${z.deltaPct}% · ${z.tier}</span>
        <div class="f4-zone-bar"><div class="f4-zone-fill" style="width:${w}%"></div></div>
      </div>`;
    }).join('');

    ref('cap').textContent = `Combines 25-year fire-heat trends with +${wPct}% dry-weather stress to ${hYear}; click "Methodology & Data Used" above for details.`;
    renderMethodology(f);

    renderBrief(buildDeterministicBrief(f), 'Trend summary', fetchAi);
    if (fetchAi) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => requestAiBrief(f, false), 220);
    }
    return f;
  }

  aiBtn.addEventListener('click', () => {
    const f = renderForecast(store.get(), false);
    if (f) requestAiBrief(f, true);
  });

  async function build(state) {
    const my = ++scopeToken;
    if (!scope) spinner(el, 'Loading forecast…');
    const sc = await data.getScope(state);
    if (my !== scopeToken) return;
    scope = sc;
    if (!scope || !scope.meta) {
      theme.placeholder(el);
      return;
    }
    if (!root.parentNode) {
      el.innerHTML = '';
      el.appendChild(root);
    }
    renderForecast(state, true);
  }

  store.subscribe((state, prev) => {
    if (state.countryId !== prev.countryId) {
      build(state);
    } else if (
      state.horizonYear !== prev.horizonYear
      || state.warmingPct !== prev.warmingPct
      || state.showPredictedOverlay !== prev.showPredictedOverlay
    ) {
      renderForecast(state, state.horizonYear !== prev.horizonYear || state.warmingPct !== prev.warmingPct);
    }
  });

  await build(store.get());
}
