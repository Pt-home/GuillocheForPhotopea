// /core/curve_cycloidal_stars.js
// Cycloidal Stars: epitrochoid / hypotrochoid з цільовою кількістю "cusps" (пелюсток).
// Ми підбираємо R як кратне r, щоб отрмати рівно n пелюсток:
//
//  kind='epi':   R = r * (n - 1)   → #cusps = (R + r) / r = n
//  kind='hypo':  R = r * (n + 1)   → #cusps = (R - r) / r = n
//
// Параметри:
//  kind: 'epi' | 'hypo'
//  n: integer ≥ 2   (кількість пелюсток/вершин зірки)
//  r: rolling radius (px)
//  d: pen offset (px) — 0..2r; при d=r маємо класику (epi/hypo -cycloid)
//  turns: 'auto' або int — кратність базового періоду
//
// Повертає: { pathData, bbox, stats }

export function sampleCycloidalStars(params, quality){
  const {
    kind = 'hypo',   // 'epi' | 'hypo'
    n = 7,           // petals/cusps
    r = 24,          // small (rolling) radius, px
    d = 24,          // pen distance from small-circle center
    turns = 'auto'   // 'auto' -> один період; або 2,3,...
  } = params || {};

  // derived fixed radius R so that cusp count = n
  const R = (kind === 'epi') ? r * Math.max(1, (n - 1)) : r * Math.max(1, (n + 1));

  // closure period in parameter t:
  //   hypo: T = 2π * r / gcd(r, R - r)   ;  epi: T = 2π * r / gcd(r, R + r)
  function gcd(a,b){ a=Math.abs(Math.round(a)); b=Math.abs(Math.round(b)); while(b){ const t=a%b; a=b; b=t; } return a||1; }
  const denom = (kind === 'epi') ? (R + r) : (R - r);
  const g = gcd(r, denom);
  const basePeriod = (2 * Math.PI) * (r / g);

  const mult = (turns === 'auto') ? 1 : Math.max(1, Math.floor(turns));
  const tStart = 0, tEnd = basePeriod * mult;

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 120000;

  // param eqs (standard trochoids)
  function evalPoint(t){
    if (kind === 'epi'){
      // epitrochoid (rolling outside)
      const k = (R + r) / r;
      const x = (R + r) * Math.cos(t) - d * Math.cos(k * t);
      const y = (R + r) * Math.sin(t) - d * Math.sin(k * t);
      return { x, y };
    } else {
      // hypotrochoid (rolling inside)
      const k = (R - r) / r;
      const x = (R - r) * Math.cos(t) + d * Math.cos(k * t);
      const y = (R - r) * Math.sin(t) - d * Math.sin(k * t);
      return { x, y };
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
      const mid = evalPoint(t + dt*0.5);
      const ax = mid.x - p0.x, ay = mid.y - p0.y;
      const bx = p1.x - mid.x, by = p1.y - mid.y;
      const denom2 = (Math.hypot(ax,ay)*Math.hypot(bx,by) + 1e-9);
      const cosang = (ax*bx + ay*by) / denom2;
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
    stats: {
      vertices: pts.length,
      lengthPx: length,
      R, r, d, n, kind,
      period: basePeriod
    }
  };
}
