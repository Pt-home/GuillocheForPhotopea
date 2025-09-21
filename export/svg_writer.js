function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

export function writeSVG(pathData, bbox, view, stroke, meta){
  const { polylines, closed } = pathData;
  const pad = view.padding ?? 24;

  const xmin = Math.min(bbox.xmin, -1), ymin = Math.min(bbox.ymin, -1);
  const xmax = Math.max(bbox.xmax, +1), ymax = Math.max(bbox.ymax, +1);

  const vbW = (xmax - xmin) + pad*2;
  const vbH = (ymax - ymin) + pad*2;
  const vbX = xmin - pad;
  const vbY = ymin - pad;

  const dParts = [];
  for (const poly of polylines){
    if (!poly.length) continue;
    const start = poly[0];
    dParts.push(`M ${start[0].toFixed(3)} ${start[1].toFixed(3)}`);
    for (let i=1;i<poly.length;i++){
      const p = poly[i];
      dParts.push(`L ${p[0].toFixed(3)} ${p[1].toFixed(3)}`);
    }
    if (closed) dParts.push('Z');
  }
  const d = dParts.join(' ');

  const metaJSON = esc(JSON.stringify(meta));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(3)} ${vbY.toFixed(3)} ${vbW.toFixed(3)} ${vbH.toFixed(3)}">
  <metadata>${metaJSON}</metadata>
  <g fill="none" stroke="${esc(stroke.color)}" stroke-width="${(stroke.width||1)}" stroke-linecap="round" stroke-linejoin="round" opacity="${stroke.opacity??1}">
    <path d="${d}"/>
  </g>
</svg>`;
}
