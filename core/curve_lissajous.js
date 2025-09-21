// /core/curve_lissajous.js
// Lissajous: x = A sin(a t + δ), y = B sin(b t)
// Contract: sample(params, quality) -> { pathData, bbox, stats }

function gcd(a,b){ a=Math.abs(Math.round(a)); b=Math.abs(Math.round(b)); while(b){ const t=a%b; a=b; b=t; } return a||1; }
function lcm(a,b){ return a && b ? Math.abs(a*b)/gcd(a,b) : 0; }

export function sampleLissajous(params, quality){
  const {
    A = 120, B = 120,
    a = 3, b = 2,
    delta = 0,        // phase shift (rad)
    turns = 'auto'    // 'auto' or integer multiplier
  } = params;

  // One closed period occurs when t spans 0..2π*LCM(1, a/b rational)
  // Practically: T = 2π * L, where L = LCM(a, b) / a  (or simply 2π * b if a,b coprime)
  const g = gcd(a, b);
  const baseCycles = b / g;            // minimal cycles for closure in t-space
  const baseT = 2 * Math.PI * baseCycles;
  const mult = (turns === 'auto') ? 1 : Math.max(1, Math.floor(turns));
  const tStart = 0, tEnd = baseT * mult;

  const maxAngle = Math.max(0.0001, (quality?.maxAngleStepDeg ?? 0.35) * Math.PI/180);
  const maxSeg   = quality?.maxSegLenPx ?? 2.0;
  const maxVerts = quality?.maxVerts ?? 60000;

  function evalPoint(t){
    const x = A * Math.sin(a * t + delta);
    const y = B * Math.sin(b * t);
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
      // curvature-ish check
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
