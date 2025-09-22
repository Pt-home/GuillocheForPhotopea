// app.js — v2.1 

import { createStore } from './state/store.js';
import {
  PRESET_CLASSIC, PRESET_TROCHOID, PRESET_LISSAJOUS,
  PRESET_HARMONOGRAPH, PRESET_RHODONEA, PRESET_SUPERFORMULA,
  PRESET_MAURER_ROSE, PRESET_SUPERELLIPSE, PRESET_FOURIER,
  PRESET_LOG_SPIRAL, PRESET_CYCLOIDAL_STARS, PRESET_PHYLL,
  PRESET_ROSE_MIX, PRESET_CLOTHOID
} from './state/presets.js';

import { samplePolarHarmonics } from './core/curve_polar_harmonics.js';
import { sampleTrochoid } from './core/curve_trochoid.js';
import { sampleLissajous } from './core/curve_lissajous.js';
import { sampleHarmonograph } from './core/curve_harmonograph.js';
import { sampleRhodonea } from './core/curve_rhodonea.js';
import { sampleSuperformula } from './core/curve_superformula.js';
import { sampleMaurerRose } from './core/curve_maurer_rose.js';
import { sampleSuperellipse } from './core/curve_superellipse.js';
import { sampleFourier } from './core/curve_fourier.js';
import { sampleLogSpiral } from './core/curve_log_spiral.js';
import { sampleCycloidalStars } from './core/curve_cycloidal_stars.js';
import { samplePhyllotaxis } from './core/curve_phyllotaxis.js';
import { sampleRoseMix } from './core/curve_rose_mix.js';
import { sampleClothoid } from './core/curve_clothoid.js';

import { renderPathData } from './render/canvas_renderer.js';
import { writeSVG } from './export/svg_writer.js';
import { writePNG } from './export/png_writer.js';

import { mountPolarPanel } from './ui/panels.js';
import { mountTrochoidPanel } from './ui/panels_trochoid.js';
import { mountLissajousPanel } from './ui/panels_lissajous.js';
import { mountHarmonographPanel } from './ui/panels_harmonograph.js';
import { mountRhodoneaPanel } from './ui/panels_rhodonea.js';
import { mountSuperformulaPanel } from './ui/panels_superformula.js';
import { mountMaurerRosePanel } from './ui/panels_maurer_rose.js';
import { mountSuperellipsePanel } from './ui/panels_superellipse.js';
import { mountFourierPanel } from './ui/panels_fourier.js';
import { mountLogSpiralPanel } from './ui/panels_log_spiral.js';
import { mountCycloidalStarsPanel } from './ui/panels_cycloidal_stars.js';
import { mountPhyllotaxisPanel } from './ui/panels_phyllotaxis.js';
import { mountRoseMixPanel } from './ui/panels_rose_mix.js';
import { mountClothoidPanel } from './ui/panels_clothoid.js';

// DOM
const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');
const methodSel = document.getElementById('method');
const panelRoot = document.getElementById('panel');

// Store
const store = createStore({
  method: 'polar_harmonics',
  stroke: { color: '#9ee6ff', width: 0.5, opacity: 1.0 },
  view: { size: 900, padding: 24, bg: '#0b0e12' }, // preview bg only
  quality: { maxAngleStepDeg: 0.35, maxSegLenPx: 2.0, maxVerts: 120000 },
  params: PRESET_CLASSIC,
});

// --- UI Mounting ---
let unmountPanel = () => {};

function mountPanel() {
  try { unmountPanel(); } catch (_) {}
  panelRoot.innerHTML = '';

  const m = store.getState().method;
  if (m === 'polar_harmonics') {
    const res = mountPolarPanel(panelRoot, store);                 unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'trochoid') {
    const res = mountTrochoidPanel(panelRoot, store);              unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'lissajous') {
    const res = mountLissajousPanel(panelRoot, store);             unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'harmonograph') {
    const res = mountHarmonographPanel(panelRoot, store);          unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'rhodonea') {
    const res = mountRhodoneaPanel(panelRoot, store);              unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'superformula') {
    const res = mountSuperformulaPanel(panelRoot, store);          unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'maurer_rose') {
    const res = mountMaurerRosePanel(panelRoot, store);            unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'superellipse') {
    const res = mountSuperellipsePanel(panelRoot, store);          unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'fourier') {
    const res = mountFourierPanel(panelRoot, store);               unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'log_spiral') {
    const res = mountLogSpiralPanel(panelRoot, store);             unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'cycloidal_stars') {
    const res = mountCycloidalStarsPanel(panelRoot, store);        unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'phyllotaxis') {
    const res = mountPhyllotaxisPanel(panelRoot, store);           unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'rose_mix') {
    const res = mountRoseMixPanel(panelRoot, store);               unmountPanel = res?.destroy ?? (()=>{});
  } else if (m === 'clothoid') {
    const res = mountClothoidPanel(panelRoot, store);              unmountPanel = res?.destroy ?? (()=>{});
  }
}

function computePath() {
  const st = store.getState();
  if (st.method === 'polar_harmonics') return samplePolarHarmonics(st.params, st.quality);
  if (st.method === 'trochoid')        return sampleTrochoid(st.params, st.quality);
  if (st.method === 'lissajous')       return sampleLissajous(st.params, st.quality);
  if (st.method === 'harmonograph')    return sampleHarmonograph(st.params, st.quality);
  if (st.method === 'rhodonea')        return sampleRhodonea(st.params, st.quality);
  if (st.method === 'superformula')    return sampleSuperformula(st.params, st.quality);
  if (st.method === 'maurer_rose')     return sampleMaurerRose(st.params, st.quality);
  if (st.method === 'superellipse')    return sampleSuperellipse(st.params, st.quality);
  if (st.method === 'fourier')         return sampleFourier(st.params, st.quality);
  if (st.method === 'log_spiral')      return sampleLogSpiral(st.params, st.quality);
  if (st.method === 'cycloidal_stars') return sampleCycloidalStars(st.params, st.quality);
  if (st.method === 'phyllotaxis')     return samplePhyllotaxis(st.params, st.quality);
  if (st.method === 'rose_mix')        return sampleRoseMix(st.params, st.quality);
  if (st.method === 'clothoid')        return sampleClothoid(st.params, st.quality);
  return samplePolarHarmonics(st.params, st.quality);
}

function redraw() {
  const st = store.getState();
  const { pathData, bbox, stats } = computePath();
  renderPathData(ctx, canvas, pathData, bbox, st.stroke, st.view);

  const mv = document.getElementById('m-verts');
  const ml = document.getElementById('m-len');
  const mc = document.getElementById('m-closed');
  if (mv) mv.textContent = stats.vertices.toString();
  if (ml) ml.textContent = stats.lengthPx.toFixed(1);
  if (mc) mc.textContent = pathData.closed ? 'yes' : 'no';
}

store.subscribe(redraw);
if (methodSel) methodSel.value = store.getState().method;

function paramsFor(val){
  if (val === 'polar_harmonics') return PRESET_CLASSIC;
  if (val === 'trochoid')        return PRESET_TROCHOID;
  if (val === 'lissajous')       return PRESET_LISSAJOUS;
  if (val === 'harmonograph')    return PRESET_HARMONOGRAPH;
  if (val === 'rhodonea')        return PRESET_RHODONEA;
  if (val === 'superformula')    return PRESET_SUPERFORMULA;
  if (val === 'maurer_rose')     return PRESET_MAURER_ROSE;
  if (val === 'superellipse')    return PRESET_SUPERELLIPSE;
  if (val === 'fourier')         return PRESET_FOURIER;
  if (val === 'log_spiral')      return PRESET_LOG_SPIRAL;
  if (val === 'cycloidal_stars') return PRESET_CYCLOIDAL_STARS;
  if (val === 'phyllotaxis')     return PRESET_PHYLL;
  if (val === 'rose_mix')        return PRESET_ROSE_MIX;
  if (val === 'clothoid')        return PRESET_CLOTHOID;
  return store.getState().params;
}

function switchMethod(val, { preserveParams = false } = {}) {
  const next = preserveParams ? store.getState().params : paramsFor(val);
  store.setState({ method: val, params: next });
  if (methodSel) methodSel.value = val;
  mountPanel();
}

if (methodSel) {
  methodSel.addEventListener('change', () => switchMethod(methodSel.value));
  methodSel.addEventListener('input',  () => switchMethod(methodSel.value));
}

mountPanel();
redraw();

// --- Export buttons (local files) ---
document.getElementById('btn-svg')?.addEventListener('click', () => {
  const st = store.getState();
  const { pathData, bbox } = computePath();
  const svg = writeSVG(pathData, bbox, st.view, st.stroke, {
    method: st.method, params: st.params, quality: st.quality, stroke: st.stroke, version: '2.1'
  });
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'guilloche.svg' });
  a.click(); URL.revokeObjectURL(a.href);
});

document.getElementById('btn-png')?.addEventListener('click', async () => {
  const dataURL = window.getTransparentPNGDataURL();
  if (!dataURL) { alert('PNG export failed'); return; }
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'guilloche.png';
  a.click();
});

// --- Save/Load JSON ---
document.getElementById('btn-save')?.addEventListener('click', () => {
  const st = store.getState();
  const cfg = { method: st.method, params: st.params, stroke: st.stroke, quality: st.quality };
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'guilloche_config.json' });
  a.click(); URL.revokeObjectURL(a.href);
});

document.getElementById('input-load')?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const cfg = JSON.parse(await file.text());
    if (!cfg.method) { alert('Config is missing "method".'); e.target.value = ''; return; }
    store.setState({
      method: cfg.method,
      params: cfg.params ?? store.getState().params,
      stroke: cfg.stroke ?? store.getState().stroke,
      quality: cfg.quality ?? store.getState().quality
    });
    switchMethod(cfg.method, { preserveParams: true });
    mountPanel();
    redraw();
  } catch (err) {
    console.error(err);
    alert('Failed to parse config JSON.');
  } finally {
    e.target.value = '';
  }
});

// === Global hooks for Photopea bridge ===
window.getTransparentPNGDataURL = () => {
  try {
    const st = store.getState();
    const { pathData, bbox } = computePath();
    const off = document.createElement('canvas');
    off.width = st.view.size ?? 900;
    off.height = st.view.size ?? 900;
    const offCtx = off.getContext('2d');
    const viewForExport = { ...st.view, bg: null }; // transparent!
    renderPathData(offCtx, off, pathData, bbox, st.stroke, viewForExport);
    return off.toDataURL('image/png');
  } catch (e) {
    console.error('getTransparentPNGDataURL failed', e);
    return null;
  }
};

window.getCurrentSVGString = () => {
  try {
    const st = store.getState();
    const { pathData, bbox } = computePath();
    return writeSVG(pathData, bbox, st.view, st.stroke, {
      method: st.method, params: st.params, quality: st.quality, stroke: st.stroke, version: '2.1'
    });
  } catch (e) {
    console.error('getCurrentSVGString failed', e);
    return '<svg xmlns="http://www.w3.org/2000/svg"/>';
  }
};

