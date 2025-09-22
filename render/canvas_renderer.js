export function renderPathData(ctx, canvas, pathData, bbox, stroke, view) {
  const W = canvas.width, H = canvas.height;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,W,H);

  const bg = view?.bg;
  if (bg != null && bg !== 'transparent') {
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);
  }

  const pad = view?.padding ?? 0;
  const vbw = Math.max(1e-9, (bbox.xmax - bbox.xmin));
  const vbh = Math.max(1e-9, (bbox.ymax - bbox.ymin));
  const sx = (W - 2*pad) / vbw;
  const sy = (H - 2*pad) / vbh;
  const s = Math.min(sx, sy);

  const cx = (bbox.xmin + bbox.xmax) * 0.5;
  const cy = (bbox.ymin + bbox.ymax) * 0.5;
  const tx = W * 0.5 - s * cx;
  const ty = H * 0.5 - s * cy;

  ctx.setTransform(s, 0, 0, s, tx, ty);

  ctx.lineWidth = stroke?.width ?? 1.2;
  ctx.strokeStyle = stroke?.color ?? '#9ee6ff';
  ctx.globalAlpha = stroke?.opacity ?? 1.0;
  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';

  const lines = pathData?.polylines ?? [];
  for (const poly of lines) {
    if (!poly || poly.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i=1;i<poly.length;i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.stroke();
  }

  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha = 1;
}

