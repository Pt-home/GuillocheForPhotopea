// Trochoid (spirograph): epitrochoid / hypotrochoid
// Contract: sample(params, quality) -> { pathData, bbox, stats }
function frac(a){ return Math.abs(a); }
function gcd(a,b){ a=Math.round(frac(a)); b=Math.round(frac(b)); while(b){ const t=a%b; a=b; b=t; } return a||1; }
function rationalize(x, tol=1e-6, maxDen=10000){
  // Continued fractions to approximate x ≈ p/q
  let h1=1, h0=0, k1=0, k0=1, b=x;
  do{
    const a=Math.floor(b);
    const h2=a*h1+h0, k2=a*k1+k0;
    if (k2>maxDen) break;
    h0=h1; k0=k1; h1=h2; k1=k2;
    const diff = Math.abs(x - h1/k1);
    if (diff<tol) break;
    b=1/(b-a);
  }while(true);
  return { p:h1, q:k1 };
}

export function sampleTrochoid(params, quality){
  const {
    kind = 'hypotrochoid',  // 'hypotrochoid' | 'epitrochoid'
    R = 140,                // fixed/base radius
    r = 37,                 // rolling radius
    d = 18,                 // pen offset
    lock = { enabled:false, p:140, q:37 }, // optional integer lock R:r = p:q (for UI)
    turns = 'auto'          // 'auto' | integer >=1 (multiplier of the base period)
  } = params;

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 60000;

  // Base factors
  const S = (kind === 'epitrochoid') ? (R + r) : (R - r);
  const K = S / r; // frequency ratio for the second cosine/sine

  // Determine one full period in 't' so both cos(t) and cos(K t) repeat
  // If K ≈ p/q (reduced), period T = 2π * q
  const { q } = rationalize(K, 1e-9, 20000);
  const baseT = 2 * Math.PI * (q || 1);

  const mult = (turns === 'auto') ? 1 : Math.max(1, Math.floor(turns));
  const tStart = 0, tEnd = baseT * mult;

  function evalPoint(t){
    if (kind === 'epitrochoid'){
      const x =  (R + r) * Math.cos(t) - d * Math.cos(K * t);
      const y =  (R + r) * Math.sin(t) - d * Math.sin(K * t);
      return {x,y};
    } else { // hypotrochoid
      const x =  (R - r) * Math.cos(t) + d * Math.cos(K * t);
      const y =  (R - r) * Math.sin(t) - d * Math.sin(K * t);
      return {x,y};
    }
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
      // mid-turn check
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

  // closure: endpoints should match after full period
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
