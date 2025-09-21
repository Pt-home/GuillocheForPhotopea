export function renderPathData(ctx, canvas, pathData, bbox, stroke, view){
  const { padding=24, bg='#000' } = view;
  const { polylines, closed } = pathData;

  // fit to canvas with padding
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,w,h);

  const bx = bbox.xmin, by = bbox.ymin, bw = bbox.xmax - bbox.xmin, bh = bbox.ymax - bbox.ymin;
  const sx = (w - 2*padding) / (bw || 1);
  const sy = (h - 2*padding) / (bh || 1);
  const s = Math.min(sx, sy);
  const ox = (w - s*bw)/2 - s*bx;
  const oy = (h - s*bh)/2 - s*by;

  ctx.translate(ox, oy);
  ctx.scale(s, s);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.color;
  ctx.globalAlpha = stroke.opacity ?? 1;
  ctx.lineWidth = (stroke.width || 1) / s; // constant visual width

  for (const poly of polylines){
    if (poly.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i=1;i<poly.length;i++) ctx.lineTo(poly[i][0], poly[i][1]);
    if (closed) ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}
