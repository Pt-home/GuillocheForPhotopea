// /core/curve_maurer_rose.js
// Maurer Rose: chords drawn between points on a Rhodonea (Rose) curve.
// Classic construction: P_i = Rose(theta = i * d°), connect P_i -> P_{i+1}
// Params:
//  A: radius scale
//  k: rose frequency (can be integer or rational; integer typical)
//  phi: phase (rad)
//  variant: 'cos' | 'sin'  (sin is cos with +π/2)
//  dDeg: step in degrees between consecutive samples on the rose (e.g., 71°)
//  count: how many samples (and thus segments) to draw
//  close: boolean — connect last to first
//
// Returns { pathData:{polylines:[...], closed}, bbox, stats }

export function sampleMaurerRose(params, quality){
  const {
    A = 140,
    k = 6,
    phi = 0,
    variant = 'sin',
    dDeg = 71,           // classic! produces intricate meshes
    count = 360,         // typical — one full lap in degrees
    close = false
  } = params || {};

  const maxVerts = quality?.maxVerts ?? 120000;

  const phase = (variant === 'sin') ? (phi + Math.PI/2) : phi;
  const d = (dDeg || 0) * Math.PI / 180;

  function rosePoint(theta){
    const r = A * Math.cos(k * theta + phase);
    return {
      x: r * Math.cos(theta),
      y: r * Math.sin(theta)
    };
  }

  const pts = [];
  for (let i=0; i<count; i++){
    const theta = i * d;
    const {x,y} = rosePoint(theta);
    pts.push([x,y]);
    if (pts.length >= maxVerts) break;
  }
  if (close && pts.length > 1) pts.push(pts[0].slice());

  // stats
  let length = 0;
  for (let i=1; i<pts.length; i++){
    length += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
  }

  // bbox
  let xmin=+Infinity,xmax=-Infinity,ymin=+Infinity,ymax=-Infinity;
  for (const [x,y] of pts){ if(x<xmin)xmin=x; if(x>xmax)xmax=x; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }

  return {
    pathData: { polylines: [pts], closed: !!close },
    bbox: { xmin, xmax, ymin, ymax },
    stats: { vertices: pts.length, lengthPx: length }
  };
}
