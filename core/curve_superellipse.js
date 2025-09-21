// /core/curve_superellipse.js
// Superellipse (Lamé curve):
// |x/A|^p + |y/B|^p = 1
// Parametric form:
//   x(t) = A * sgn(cos t) * |cos t|^{2/p}
//   y(t) = B * sgn(sin t) * |sin t|^{2/p}
// Optional rotation by angle 'rot'.
// Contract: sample(params, quality) -> { pathData, bbox, stats }

export function sampleSuperellipse(params, quality){
  const {
    A = 160,   // horizontal radius
    B = 120,   // vertical radius
    p = 2.5,   // exponent (p=2 -> ellipse; p>2 -> squarer; 0<p<2 -> starry)
    rot = 0,   // rotation (radians)
    turns = 'auto' // 'auto' or integer multiplier of 2π
  } = params || {};

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 120000;

  const baseT = 2 * Math.PI;
  const mult  = (turns === 'auto') ? 1 : Math.max(1, Math.floor(turns));
  const tStart = 0, tEnd = baseT * mult;

  const invP = 1 / (p || 1e-9);
  const powX = 2 * invP; // exponent for cos
  const powY = 2 * invP; // exponent for sin

  const c = Math.cos(rot), s = Math.sin(rot);

  function sgn(v){ return v < 0 ? -1 : 1; }

  function evalPoint(t){
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const x0 = A * sgn(ct) * Math.pow(Math.abs(ct), powX);
    const y0 = B * sgn(st) * Math.pow(Math.abs(st), powY);
    // rotate
    const x = x0 * c - y0 * s;
    const y = x0 * s + y0 * c;
    return {x, y};
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

      // curvature-ish mid-turn check
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

  // closed by construction
  const closed = true;

  // bbox
  let xmin=+Infinity,xmax=-Infinity,ymin=+Infinity,ymax=-Infinity;
  for (const [x,y] of pts){ if(x<xmin)xmin=x; if(x>xmax)xmax=x; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }

  return {
    pathData: { polylines:[pts], closed },
    bbox: { xmin, xmax, ymin, ymax },
    stats: { vertices: pts.length, lengthPx: length }
  };
}
