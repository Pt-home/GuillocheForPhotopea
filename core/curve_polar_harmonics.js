function lcm(a, b){ return a && b ? Math.abs(a * b) / gcd(a, b) : 0; }
function gcd(a, b){ a=Math.abs(a); b=Math.abs(b); while (b){ const t=a%b; a=b; b=t; } return a||1; }

function collectFrequencies(params) {
  const set = new Set();
  params.terms.forEach(t => set.add(Math.abs(t.m|0)));
  (params.fm?.AM ?? []).forEach(t => set.add(Math.abs(t.k|0)));
  (params.fm?.FM ?? []).forEach(t => set.add(Math.abs(t.k|0)));
  set.delete(0);
  return [...set];
}

function autoPeriod(freqs) {
  if (freqs.length === 0) return 2*Math.PI;
  let L = 1;
  for (const f of freqs) L = lcm(L, f);
  // період = 2π * ціле число, що закриває всі гармоніки
  return 2 * Math.PI * L;
}

export function samplePolarHarmonics(params, quality){
  const { R0, terms, fm, theta_span, closure } = params;
  const AM = fm?.AM ?? [];
  const FM = fm?.FM ?? [];

  // визначаємо кутовий діапазон
  let start = 0, end;
  if (theta_span === "auto" || !Array.isArray(theta_span)) {
    const freqs = collectFrequencies(params);
    end = autoPeriod(freqs); // гарант. замикання
  } else {
    start = +theta_span[0] || 0;
    end   = +theta_span[1] || (start + 2*Math.PI);
  }

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.5) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 3.0;
  const maxVerts = quality?.maxVerts ?? 60000;

  const pts = [];
  let theta = start;
  let prev = null;
  let length = 0;

  function evalPoint(th) {
    // frequency modulation: theta' = theta + Σ b sin(kθ+φ)
    let thp = th;
    if (FM.length) {
      let delta = 0;
      for (const {b=0,k=0,phi=0} of FM) delta += b * Math.sin(k*th + phi);
      thp = th + delta;
    }
    // amplitude modulation: scale = 1 + Σ a cos(kθ+φ)
    let scale = 1;
    for (const {a=0,k=0,phi=0} of AM) scale += a * Math.cos(k*th + phi);

    // base polar sum: r = R0 + Σ A cos(mθ'+φ)
    let r = R0;
    for (const {A=0,m=0,phi=0} of terms) r += A * Math.cos(m*thp + phi);

    const x = r * Math.cos(th);
    const y = r * Math.sin(th);
    return {x:x*scale, y:y*scale};
  }

  // adaptive stepping by curvature-ish heuristic
  const push = (p) => { pts.push([p.x, p.y]); };

  let p0 = evalPoint(theta);
  push(p0);

  while (theta < end) {
    // try step
    let dth = maxAngle;
    // local refinement loop (two tries)
    for (let iter=0; iter<2; iter++){
      const p1 = evalPoint(theta + dth);
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      const segLen = Math.hypot(dx, dy);
      if (segLen > maxSeg) { dth *= 0.5; continue; }
      // corner check with mid point
      const mid = evalPoint(theta + dth*0.5);
      const ax = mid.x - p0.x, ay = mid.y - p0.y;
      const bx = p1.x - mid.x, by = p1.y - mid.y;
      const turn = Math.acos(
        Math.max(-1, Math.min(1,
          (ax*bx + ay*by) / (Math.hypot(ax,ay)*Math.hypot(bx,by) + 1e-9)
        ))
      );
      if (turn > maxAngle*1.5) { dth *= 0.5; continue; }
      break;
    }

    theta = Math.min(theta + dth, end);
    const p1 = evalPoint(theta);
    length += Math.hypot(p1.x - p0.x, p1.y - p0.y);
    push(p1);
    p0 = p1;

    if (pts.length > maxVerts) break;
  }

  // closure flag: we assume closed if auto-period and endpoints close
  const closed = (closure?.mode ?? 'auto') === 'auto'
    ? (Math.hypot(pts[0][0]-pts[pts.length-1][0], pts[0][1]-pts[pts.length-1][1]) < 0.5)
    : false;

  // bbox
  let xmin=+Infinity,xmax=-Infinity,ymin=+Infinity,ymax=-Infinity;
  for (const [x,y] of pts){ if(x<xmin)xmin=x; if(x>xmax)xmax=x; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }

  return {
    pathData: { polylines: [pts], closed },
    bbox: { xmin, xmax, ymin, ymax },
    stats: { vertices: pts.length, lengthPx: length }
  };
}
