// /core/curve_log_spiral.js
// Logarithmic spiral with optional radial AM (amplitude modulation).
// Base: r(t) = a * exp(b * t)
// AM:   r(t) *= (1 + Σ ai * cos(ki * t + φi))
// t runs in radians. We sample t in [theta0, theta0 + 2π*turns] (or one lap if 'auto').
//
// Contract: sample(params, quality) -> { pathData, bbox, stats }

export function sampleLogSpiral(params, quality){
  const {
    a = 2.0,             // base radius at t=0
    b = 0.12,            // growth rate (>0 grows outwards, <0 inwards)
    AM = [ { a: 0.12, k: 6, phi: 0 } ], // radial wobble terms
    theta0 = 0,          // start angle (rad)
    turns = 6            // number of 2π laps ('auto' => 1)
  } = params || {};

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 120000;

  const laps = (turns === 'auto') ? 1 : Math.max(1, Math.floor(turns));
  const tStart = theta0;
  const tEnd   = theta0 + laps * 2 * Math.PI;

  function radialAM(t){
    if (!AM || !AM.length) return 1;
    let m = 1;
    for (const term of AM){
      const aa  = term.a ?? 0;
      const kk  = term.k ?? 0;
      const phi = term.phi ?? 0;
      m += aa * Math.cos(kk * t + phi);
    }
    // avoid negative/zero radius if modulation is extreme
    return Math.max(1e-6, m);
  }

  function rOf(t){
    const base = a * Math.exp(b * t);
    return base * radialAM(t);
  }

  function evalPoint(t){
    const r = rOf(t);
    return { x: r * Math.cos(t), y: r * Math.sin(t) };
  }

  const pts = [];
  let t = tStart;
  let p0 = evalPoint(t);
  pts.push([p0.x, p0.y]);
  let length = 0;

  while (t < tEnd){
    let dt = maxAngle;

    // quick adaptive refinement: keep segments short and curvature sane
    for (let iter=0; iter<2; iter++){
      const p1 = evalPoint(t + dt);
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      const segLen = Math.hypot(dx, dy);
      if (segLen > maxSeg){ dt *= 0.5; continue; }

      const mid = evalPoint(t + dt * 0.5);
      const ax = mid.x - p0.x, ay = mid.y - p0.y;
      const bx = p1.x - mid.x, by = p1.y - mid.y;
      const denom = (Math.hypot(ax,ay)*Math.hypot(bx,by) + 1e-9);
      const cosang = (ax*bx + ay*by) / denom;
      const turn = Math.acos(Math.max(-1, Math.min(1, cosang)));
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

  // open curve by design
  const closed = false;

  // bbox
  let xmin=+Infinity,xmax=-Infinity,ymin=+Infinity,ymax=-Infinity;
  for (const [x,y] of pts){ if(x<xmin)xmin=x; if(x>xmax)xmax=x; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }

  return {
    pathData: { polylines: [pts], closed },
    bbox: { xmin, xmax, ymin, ymax },
    stats: { vertices: pts.length, lengthPx: length }
  };
}
