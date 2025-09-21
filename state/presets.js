// /state/presets.js — presets

export const PRESET_CLASSIC = {
  R0: 120,
  terms: [
    { A: 18, m: 12, phi: 0 },
    { A: 7,  m: 36, phi: Math.PI/6 }
  ],
  fm: { AM: [ { a: 0.08, k: 6,  phi: 0 } ], FM: [] },
  theta_span: "auto",
  closure: { mode: "auto" }
};

export const PRESET_TROCHOID = { kind:'hypotrochoid', R:140, r:37, d:18, turns:'auto' };

export const PRESET_LISSAJOUS = { A:120, B:120, a:3, b:2, delta:0, turns:'auto' };

export const PRESET_HARMONOGRAPH = {
  x_terms: [
    { A: 280, omega: 0.50, phi: 1.57, decay: 0.0007 },
    { A:  50, omega: 17.50, phi: 1.57, decay: 0.0001 }
  ],
  y_terms: [
    { B: 280, nu: 1.50, psi: 0.00, decay: 0.0007 },
    { B:  50, nu: 11.00, psi: 0.50, decay: 0.0001 }
  ],
  t: { start: 0, end: 90 }
};

export const PRESET_RHODONEA = { A:140, k:5, phi:0, variant:'cos', turns:'auto' };

export const PRESET_SUPERFORMULA = {
  m:6, a:1, b:1, n1:0.3, n2:1.7, n3:1.7, scale:140, turns:'auto', variant:'standard'
};

export const PRESET_MAURER_ROSE = { A:140, k:6, phi:0, variant:'sin', dDeg:71, count:360, close:false };

export const PRESET_SUPERELLIPSE = { A:160, B:120, p:2.5, rot:0, turns:'auto' };

export const PRESET_FOURIER = {
  x_terms: [
    { kind:'cos', amp:120, freq:3, phase:0 },
    { kind:'sin', amp:35,  freq:9, phase:0 }
  ],
  y_terms: [
    { kind:'cos', amp:120, freq:2, phase:Math.PI/4 },
    { kind:'sin', amp:40,  freq:5, phase:Math.PI/3 }
  ],
  center: { x:0, y:0 }, turns:'auto'
};

export const PRESET_LOG_SPIRAL = { a:2.0, b:0.12, AM:[{a:0.12,k:6,phi:0}], theta0:0, turns:6 };

export const PRESET_CYCLOIDAL_STARS = { kind:'hypo', n:7, r:24, d:24, turns:'auto' };

// Fixed phyllotaxis preset (your choice)
export const PRESET_PHYLL = {
  c: 6, nPoints: 300, alphaDeg: 137.5,
  connect: 'spline', splineSubdiv: 6, center: { x: 0, y: 0 }
};

// Fixed Rose Mix preset (your choice)
export const PRESET_ROSE_MIX = {
  term1: { A: 120, k: 6,  phi: 0,             variant: 'cos' },
  term2: { A:  60, k: 12, phi: Math.PI/6,     variant: 'cos' },
  turns: 'auto', center: { x:0, y:0 }, rot: 0
};

// New: Clothoid
export const PRESET_CLOTHOID = {
  t0: 0, t1: 3.5, symmetric: true,
  scale: 180, rotate: 0, dir: 1,
  center: { x: 0, y: 0 }
};
