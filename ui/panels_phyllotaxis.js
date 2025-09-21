// /ui/panels_phyllotaxis.js — Phyllotaxis UI

export function mountPhyllotaxisPanel(root, store){
  root.innerHTML = '';
  const p = store.getState().params;

  const group = (t)=>{ const g=document.createElement('div'); g.className='group'; g.innerHTML=`<h3>${t}</h3>`; return g; };
  const rowNum = (label, val, min, max, step, onChange)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const inp=document.createElement('input'); inp.type='number';
    if(min!=null)inp.min=min; if(max!=null)inp.max=max; if(step!=null)inp.step=step;
    inp.value=val; inp.addEventListener('input',()=>onChange(parseFloat(inp.value)));
    wrap.append(lab,inp); return wrap;
  };
  const rowSel = (label, val, options, onChange)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const sel=document.createElement('select');
    options.forEach(o=>{ const op=document.createElement('option'); op.value=o; op.textContent=o; if(o===val)op.selected=true; sel.append(op); });
    sel.addEventListener('change', ()=> onChange(sel.value));
    wrap.append(lab, sel); return wrap;
  };

  // Core
  const g1 = group('Phyllotaxis (Fermat spiral seeds)');
  g1.append(
    rowNum('c (scale px)', p.c ?? 6, 0.1, 1e5, 0.1, v=> store.updatePathParams({ c: Math.max(0.1, v) })),
    rowNum('nPoints', p.nPoints ?? 1200, 2, 200000, 1, v=> store.updatePathParams({ nPoints: Math.max(2, Math.floor(v)) })),
    rowNum('alpha (deg)', p.alphaDeg ?? 137.5, 0, 360, 0.1, v=> store.updatePathParams({ alphaDeg: v })),
    rowSel('Connect', p.connect || 'polyline', ['polyline','spline'], v=> store.updatePathParams({ connect: v })),
    rowNum('Spline subdiv', p.splineSubdiv ?? 6, 1, 50, 1, v=> store.updatePathParams({ splineSubdiv: Math.max(1, Math.floor(v)) })),
  );

  // Center
  const g2 = group('Center offset');
  const cxRow = document.createElement('div'); cxRow.className='row';
  const cyRow = document.createElement('div'); cyRow.className='row';
  cxRow.innerHTML = `<label>Center X</label>`;
  cyRow.innerHTML = `<label>Center Y</label>`;
  const cx = document.createElement('input'); cx.type='number'; cx.step='0.1'; cx.value = (p.center?.x ?? 0);
  const cy = document.createElement('input'); cy.type='number'; cy.step='0.1'; cy.value = (p.center?.y ?? 0);
  cx.addEventListener('input', ()=>{
    const c = store.getState().params.center || {x:0,y:0};
    store.updatePathParams({ center: { ...c, x: parseFloat(cx.value) }});
  });
  cy.addEventListener('input', ()=>{
    const c = store.getState().params.center || {x:0,y:0};
    store.updatePathParams({ center: { ...c, y: parseFloat(cy.value) }});
  });
  cxRow.append(cx); cyRow.append(cy);
  g2.append(cxRow, cyRow);

  // Style & Quality
  const g3 = group('Style & Quality');
  const strokeColor = (()=> {
    const wrap = document.createElement('div'); wrap.className='row';
    const lab = document.createElement('label'); lab.textContent = 'Stroke';
    const inp = document.createElement('input'); inp.type='color'; inp.value = store.getState().stroke.color || '#9ee6ff';
    inp.addEventListener('input', ()=> store.setState({ stroke: { ...store.getState().stroke, color: inp.value }}));
    wrap.append(lab, inp); return wrap;
  })();
  const mkQ = (label, key, min,max,step)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const inp=document.createElement('input'); inp.type='number';
    inp.min=min; inp.max=max; inp.step=step; inp.value = store.getState().quality[key];
    inp.addEventListener('input', ()=> store.setState({ quality: { ...store.getState().quality, [key]: parseFloat(inp.value) }}));
    wrap.append(lab, inp); return wrap;
  };
  const widthRow = (()=> {
    const w=document.createElement('div'); w.className='row';
    const lab=document.createElement('label'); lab.textContent='Width (px)';
    const inp=document.createElement('input'); inp.type='number'; inp.min='0.1'; inp.max='6'; inp.step='0.1';
    inp.value = store.getState().stroke.width || 1.2;
    inp.addEventListener('input', ()=> store.setState({ stroke: { ...store.getState().stroke, width: parseFloat(inp.value) }}));
    w.append(lab,inp); return w;
  })();

  g3.append(strokeColor, widthRow,
    mkQ('Max angle (°)', 'maxAngleStepDeg', 0.05, 2.0, 0.05),
    mkQ('Max segment (px)', 'maxSegLenPx', 0.5, 6, 0.1),
  );

  root.append(g1, g2, g3);
  return { destroy(){} };
}
