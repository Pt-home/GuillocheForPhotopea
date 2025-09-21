// /core/curve_phyllotaxis.js
// Phyllotaxis path: points on a Fermat spiral connected into a curve.
// r(n) = c * sqrt(n), theta(n) = n * alpha
// alpha usually ~ 137.5° (golden angle).
//
// Params:
//  c: scale (px)
//  nPoints: number of seeds (>=2)
//  alphaDeg: angle increment in degrees
//  connect: 'polyline' | 'spline'  (Catmull-Rom polyline approximation)
//  splineSubdiv: integer >= 1  (samples per segment when connect='spline')
//  center: {x,y} optional (defaults 0,0)
//
// Returns { pathData:{polylines:[...], closed:false}, bbox, stats }

export function samplePhyllotaxis(params, quality){
  const {
    c = 6,
    nPoints = 1200,
    alphaDeg = 137.5,
    connect = 'polyline',
    splineSubdiv = 6,
    center = { x:0, y:0 }
  } = params || {};

  const maxVerts = quality?.maxVerts ?? 120000;
  const alpha = (alphaDeg || 0) * Math.PI / 180;

  // seed points
  const seeds = [];
  for (let n=0; n<nPoints; n++){
    const r = c * Math.sqrt(n);
    const t = n * alpha;
    const x = center.x + r * Math.cos(t);
    const y = center.y + r * Math.sin(t);
    seeds.push([x,y]);
    if (seeds.length >= maxVerts) break;
  }

  let pts;
  if (connect === 'spline' && seeds.length >= 4){
    pts = catmullRomPolyline(seeds, Math.max(1, Math.floor(splineSubdiv)), maxVerts);
  } else {
    pts = seeds;
  }

  // length
  let length = 0;
  for (let i=1; i<pts.length; i++){
    const dx = pts[i][0]-pts[i-1][0], dy = pts[i][1]-pts[i-1][1];
    length += Math.hypot(dx, dy);
  }

  // bbox
  let xmin=+Infinity,xmax=-Infinity,ymin=+Infinity,ymax=-Infinity;
  for (const [x,y] of pts){ if(x<xmin)xmin=x; if(x>xmax)xmax=x; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }

  return {
    pathData: { polylines:[pts], closed:false },
    bbox: { xmin, xmax, ymin, ymax },
    stats: { vertices: pts.length, lengthPx: length }
  };
}

// --- Helpers ---

// Catmull-Rom to polyline (uniform, open),
// inserts `subdiv` points between each pair using p_{i-1}, p_i, p_{i+1}, p_{i+2}
function catmullRomPolyline(points, subdiv, maxVerts){
  const out = [];
  const n = points.length;
  if (n < 2) return points.slice();

  // push first
  out.push(points[0]);

  const clamp = (i)=> Math.max(0, Math.min(n-1, i));

  for (let i=0; i<n-1; i++){
    const p0 = points[clamp(i-1)];
    const p1 = points[i];
    const p2 = points[i+1];
    const p3 = points[clamp(i+2)];
    for (let j=1; j<=subdiv; j++){
      const t = j/(subdiv+0); // (0,1]
      const t2 = t*t, t3 = t2*t;

      // Catmull-Rom basis (tau=0.5 canonical, but uniform spline commonly uses 0.5 factor)
      const a0x = -0.5*p0[0] + 1.5*p1[0] - 1.5*p2[0] + 0.5*p3[0];
      const a1x =  p0[0]    - 2.5*p1[0] + 2.0*p2[0] - 0.5*p3[0];
      const a2x = -0.5*p0[0] + 0.5*p2[0];
      const a3x =  p1[0];

      const a0y = -0.5*p0[1] + 1.5*p1[1] - 1.5*p2[1] + 0.5*p3[1];
      const a1y =  p0[1]    - 2.5*p1[1] + 2.0*p2[1] - 0.5*p3[1];
      const a2y = -0.5*p0[1] + 0.5*p2[1];
      const a3y =  p1[1];

      const x = a0x*t3 + a1x*t2 + a2x*t + a3x;
      const y = a0y*t3 + a1y*t2 + a2y*t + a3y;

      out.push([x,y]);
      if (out.length >= maxVerts) return out;
    }
  }
  return out;
}
