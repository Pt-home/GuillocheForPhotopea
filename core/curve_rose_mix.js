// /core/curve_rose_mix.js
// Rose Mix: r(θ) = A1 * F1(k1·θ + φ1) + A2 * F2(k2·θ + φ2)
// де F ∈ {sin, cos}. Класична рходонея — окремий терм; їхня сума дає багаті розетки.
//
// Contract: sample(params, quality) -> { pathData, bbox, stats }

export function sampleRoseMix(params, quality){
  const {
    term1 = { A: 120, k: 5, phi: 0, variant: 'cos' },
    term2 = { A: 60,  k: 9, phi: Math.PI/6, variant: 'cos' },
    turns = 'auto',    // кількість 2π-обертів (для замкнення достатньо LCM періодів; 'auto' → 1)
    center = { x:0, y:0 },
    rot = 0            // глобальний поворот у радіанах (додається до θ)
  } = params || {};

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 120000;

  function F(variant, t){ return (variant === 'sin') ? Math.sin(t) : Math.cos(t); }

  function rOf(theta){
    const r1 = (term1?.A ?? 0) * F(term1?.variant ?? 'cos', (term1?.k ?? 0) * theta + (term1?.phi ?? 0));
    const r2 = (term2?.A ?? 0) * F(term2?.variant ?? 'cos', (term2?.k ?? 0) * theta + (term2?.phi ?? 0));
    return r1 + r2;
  }

  // span
  const laps = (turns === 'auto') ? 1 : Math.max(1, Math.floor(turns));
  const tStart = 0;
  const tEnd = laps * 2 * Math.PI;

  function evalPoint(t){
    const th = t + rot;
    const r = rOf(th);
    return {
      x: center.x + r * Math.cos(th),
      y: center.y + r * Math.sin(th)
    };
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

  const closed = Math.hypot(pts[0][0]-pts[pts.length-1][0], pts[0][1]-pts[pts.length-1][1]) < 0.7;

  // bbox
  let xmin=+Infinity,xmax=-Infinity,ymin=+Infinity,ymax=-Infinity;
  for (const [x,y] of pts){ if(x<xmin)xmin=x; if(x>xmax)xmax=x; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }

  return {
    pathData: { polylines:[pts], closed },
    bbox: { xmin, xmax, ymin, ymax },
    stats: { vertices: pts.length, lengthPx: length }
  };
}
