// /core/curve_harmonograph.js
// Harmonograph: sums of damped sinusoids per axis
// x(t) = Σ A_i e^{-d_i t} sin(ω_i t + φ_i)
// y(t) = Σ B_j e^{-e_j t} sin(ν_j t + ψ_j)
// Contract: sample(params, quality) -> { pathData, bbox, stats }

export function sampleHarmonograph(params, quality){
  const {
    x_terms = [ {A:120, omega:2.0, phi:0, decay:0.005} ],
    y_terms = [ {B:120, nu:  2.7, psi:0, decay:0.006} ],
    t = { start:0, end: 800, step: 'auto' } // 'end' is in arbitrary time-units
  } = params;

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 60000;

  function evalXY(tt){
    let x = 0, y = 0;
    for (const {A=0, omega=0, phi=0, decay=0} of (x_terms||[])) {
      x += A * Math.exp(-decay*tt) * Math.sin(omega*tt + phi);
    }
    for (const {B=0, nu=0, psi=0, decay=0} of (y_terms||[])) {
      y += B * Math.exp(-decay*tt) * Math.sin(nu*tt + psi);
    }
    return {x,y};
  }

  // adaptive step in "time" using curvature-ish and segment checks
  const pts = [];
  let tt = t.start ?? 0;
  const tEnd = t.end ?? 800;

  let p0 = evalXY(tt);
  pts.push([p0.x, p0.y]);
  let length = 0;

  // initial dt heuristic: inverse of avg freq, clamped
  const avgW = Math.max(0.1,
    ( (x_terms||[]).reduce((s,v)=>s+Math.abs(v.omega||0),0) + (y_terms||[]).reduce((s,v)=>s+Math.abs(v.nu||0),0) ) /
    Math.max(1, (x_terms?.length||0)+(y_terms?.length||0) )
  );
  const baseDt = Math.min(2.0, Math.max(0.002, (Math.PI/24) / avgW)); // ~7.5° per base step

  while (tt < tEnd){
    let dt = baseDt;
    for (let iter=0; iter<2; iter++){
      const p1 = evalXY(tt + dt);
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      const segLen = Math.hypot(dx, dy);
      if (segLen > maxSeg){ dt *= 0.5; continue; }
      // mid-point turn
      const mid = evalXY(tt + dt*0.5);
      const ax = mid.x - p0.x, ay = mid.y - p0.y;
      const bx = p1.x - mid.x, by = p1.y - mid.y;
      const denom = (Math.hypot(ax,ay)*Math.hypot(bx,by) + 1e-9);
      const cosang = (ax*bx + ay*by) / denom;
      const turn = Math.acos(Math.max(-1, Math.min(1, cosang)));
      if (turn > maxAngle*1.5){ dt *= 0.5; continue; }
      break;
    }

    tt = Math.min(tt + dt, tEnd);
    const p1 = evalXY(tt);
    length += Math.hypot(p1.x - p0.x, p1.y - p0.y);
    pts.push([p1.x, p1.y]);
    p0 = p1;

    if (pts.length > maxVerts) break;
  }

  // harmonograph generally not exactly closed
  const closed = false;

  // bbox
  let xmin=+Infinity,xmax=-Infinity,ymin=+Infinity,ymax=-Infinity;
  for (const [x,y] of pts){ if(x<xmin)xmin=x; if(x>xmax)xmax=x; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }

  return {
    pathData: { polylines:[pts], closed },
    bbox: { xmin, xmax, ymin, ymax },
    stats: { vertices: pts.length, lengthPx: length }
  };
}
