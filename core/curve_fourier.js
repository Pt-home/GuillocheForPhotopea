// /core/curve_fourier.js
// 2D Fourier (epicycles) parametric curve:
//   x(t) = Σ amp * F(freq * t + phase), F ∈ {cos, sin}
//   y(t) = Σ amp * F(freq * t + phase)
// Contract: sample(params, quality) -> { pathData, bbox, stats }

export function sampleFourier(params, quality){
  const {
    x_terms = [
      { kind:'cos', amp:120, freq:3, phase:0 },
      { kind:'sin', amp:35,  freq:9, phase:0 }
    ],
    y_terms = [
      { kind:'cos', amp:120, freq:2, phase:Math.PI/4 },
      { kind:'sin', amp:40,  freq:5, phase:Math.PI/3 }
    ],
    center = { x:0, y:0 },
    turns = 'auto' // multiple of 2π
  } = params || {};

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 120000;

  const baseT = 2*Math.PI;
  const mult  = (turns==='auto') ? 1 : Math.max(1, Math.floor(turns));
  const tStart = 0, tEnd = baseT * mult;

  function evalSeries(t, terms){
    let v = 0;
    for (const trm of (terms||[])){
      const a = trm.amp ?? 0;
      const w = trm.freq ?? 0;
      const ph = trm.phase ?? 0;
      if ((trm.kind||'cos') === 'sin') v += a * Math.sin(w * t + ph);
      else                              v += a * Math.cos(w * t + ph);
    }
    return v;
  }

  function evalPoint(t){
    const x = center.x + evalSeries(t, x_terms);
    const y = center.y + evalSeries(t, y_terms);
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
      // curvature-ish mid check
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

  // closed-ish if returns to start
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
