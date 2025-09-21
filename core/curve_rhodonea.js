// /core/curve_rhodonea.js
// Rhodonea (Rose) curves: r(θ) = A * cos(kθ + φ)  (or sin variant via phase shift)
// Contract: sample(params, quality) -> { pathData, bbox, stats }

function gcd(a,b){ a=Math.abs(Math.round(a)); b=Math.abs(Math.round(b)); while(b){ const t=a%b; a=b; b=t; } return a||1; }

export function sampleRhodonea(params, quality){
  const {
    A = 140,           // amplitude (radius scale)
    k = 5,             // frequency (int or rational). Integer typical.
    phi = 0,           // phase shift (rad)
    variant = 'cos',   // 'cos' | 'sin' (sin is just cos with +π/2)
    turns = 'auto'     // 'auto' or integer multiplier of base period
  } = params;

  const kval = k;
  const phase = (variant === 'sin') ? (phi + Math.PI/2) : phi;

  // Period logic:
  // For integer k: rose closes after:
  // - 0..2π if k is odd (k petals)
  // - 0..π  if k is even (2k petals) — because cos(kθ) has period π for even k in polar.
  // For non-integer, approximate closure by 2π * q where k ≈ p/q (rational).
  const kAbs = Math.abs(kval);
  let baseT;
  if (Number.isInteger(kval)){
    if ((kAbs % 2) === 0) baseT = Math.PI; else baseT = 2*Math.PI;
  } else {
    // rationalization fallback using gcd on limited denominator by scaling
    const denomMax = 10000;
    const q = Math.min(denomMax, 1 + Math.floor(1/Math.max(1e-9, Math.abs(kval - Math.round(kval)))));
    baseT = 2*Math.PI*q; // safe upper bound
  }

  const mult = (turns === 'auto') ? 1 : Math.max(1, Math.floor(turns));
  const tStart = 0, tEnd = baseT * mult;

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 60000;

  function evalPoint(t){
    const r = A * Math.cos(kval * t + phase);
    // Polar to Cartesian
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    return {x,y};
  }

  const pts = [];
  let t = tStart;
  let p0 = evalPoint(t);
  pts.push([p0.x, p0.y]);
  let length = 0;

  while (t < tEnd){
    let dt = maxAngle;
    for (let iter=0; iter<2; iter++){
      const p1 = evalPoint(t + dt);
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      const segLen = Math.hypot(dx, dy);
      if (segLen > maxSeg){ dt *= 0.5; continue; }
      const mid = evalPoint(t + dt*0.5);
      const ax = mid.x - p0.x, ay = mid.y - p0.y;
      const bx = p1.x - mid.x, by = p1.y - mid.y;
      const turn = Math.acos(Math.max(-1, Math.min(1,
        (ax*bx + ay*by) / (Math.hypot(ax,ay)*Math.hypot(bx,by) + 1e-9)
      )));
      if (turn > maxAngle*1.5){ dt *= 0.5; continue; }
      break;
    }
    t = Math.min(t + dt, tEnd);
    const p1 = evalPoint(t);
    length += Math.hypot(p1.x - p0.x, p1.y - p0.y);
    pts.push([p1.x, p1.y]);
    p0 = p1;
    if (pts.length > maxVerts) break;
  }

  const closed = Math.hypot(pts[0][0]-pts[pts.length-1][0], pts[0][1]-pts[pts.length-1][1]) < 0.5;

  // bbox
  let xmin=+Infinity,xmax=-Infinity,ymin=+Infinity,ymax=-Infinity;
  for (const [x,y] of pts){ if(x<xmin)xmin=x; if(x>xmax)xmax=x; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }

  return {
    pathData: { polylines:[pts], closed },
    bbox: { xmin, xmax, ymin, ymax },
    stats: { vertices: pts.length, lengthPx: length }
  };
}
