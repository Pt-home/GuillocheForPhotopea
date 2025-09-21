// /core/curve_superformula.js
// Gielis Superformula (polar):
// r(θ) = scale * ( |cos(m θ/4)/a|^{n2} + |sin(m θ/4)/b|^{n3} )^{-1/n1}
// Contract: sample(params, quality) -> { pathData, bbox, stats }

export function sampleSuperformula(params, quality){
  const {
    m = 6,
    a = 1, b = 1,
    n1 = 0.3, n2 = 1.7, n3 = 1.7,
    scale = 140,
    turns = 'auto',      // 'auto' or integer multiplier
    variant = 'standard' // placeholder for future variants
  } = params;

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 120000;

  // Base period: 2π works well (symmetry emerges via m)
  const baseT = 2*Math.PI;
  const mult  = (turns==='auto') ? 1 : Math.max(1, Math.floor(turns));
  const tStart = 0, tEnd = baseT * mult;

  function rOf(t){
    // safe powers
    const ct = Math.cos(m * t / 4) / (a || 1e-9);
    const st = Math.sin(m * t / 4) / (b || 1e-9);
    const p = Math.pow(Math.abs(ct), n2) + Math.pow(Math.abs(st), n3);
    const denom = Math.pow(p || 1e-9, 1/(n1 || 1e-9));
    const r = scale / denom;
    return r;
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
    for (let iter=0; iter<2; iter++){
      const p1 = evalPoint(t + dt);
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      const segLen = Math.hypot(dx, dy);
      if (segLen > maxSeg){ dt *= 0.5; continue; }
      // curvature-ish check
      const mid = evalPoint(t + dt*0.5);
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

  const closed = Math.hypot(pts[0][0]-pts[pts.length-1][0], pts[0][1]-pts[pts.length-1][1]) < 0.6;

  // bbox
  let xmin=+Infinity,xmax=-Infinity,ymin=+Infinity,ymax=-Infinity;
  for (const [x,y] of pts){ if(x<xmin)xmin=x; if(x>xmax)xmax=x; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }

  return {
    pathData: { polylines:[pts], closed },
    bbox: { xmin, xmax, ymin, ymax },
    stats: { vertices: pts.length, lengthPx: length }
  };
}
