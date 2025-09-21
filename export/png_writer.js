export async function writePNG(canvas, scale = 1, filename = 'guilloche.png', bg = '#000'){
  // draw onto an offscreen canvas for desired resolution if scale != 1
  if (scale === 1) {
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
    a.click(); URL.revokeObjectURL(a.href); return;
  }
  const w = Math.floor(canvas.width * scale), h = Math.floor(canvas.height * scale);
  const off = document.createElement('canvas'); off.width = w; off.height = h;
  const octx = off.getContext('2d');
  // nearest-neighbor is fine; we redraw bitmap; but here we just scale existing canvas:
  octx.fillStyle = bg; octx.fillRect(0,0,w,h);
  octx.drawImage(canvas, 0, 0, w, h);
  const blob = await new Promise(res => off.toBlob(res, 'image/png'));
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
}
