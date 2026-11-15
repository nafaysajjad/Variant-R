# Variant-R


## Layout

```
index.html  css/tokens.css  css/layout.css  js/main.js      app shell (slots, tokens, 5-row grid)
js/store.js  js/data-config.js  js/data.js  js/theme.js     state store, CSV/GeoJSON loader, colours
js/ui/header.js  slider.js  infobox.js                      header tabs + toggle, year slider, infobox
js/charts/fig1-trend.js  fig2-before-after.js  fig3-chain.js figures (Plot, Plot, hand-built SVG)
js/map/map.js  fires.js  water.js  air.js  legend.js         MapLibre map and layers
data/regions.json  data/<scope>/{geo,rivers}.geojson  {fires,air,series}.csv
pipeline/                                                   optional Python preprocessing P0–P7
```

