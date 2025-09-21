// /ui/panels_cycloidal_stars.js — UI for Cycloidal Stars

export function mountCycloidalStarsPanel(root, store){
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
  const g1 = group('Cycloidal Stars');
  g1.append(
    rowSel('Kind', p.kind || 'hypo', ['hypo','epi'], v => store.updatePathParams({ kind: v })),
    rowNum('Cusps (n)', p.n ?? 7, 2, 64, 1, v => store.updatePathParams({ n: Math.max(2, Math.round(v)) })),
    rowNum('r (rolling radius px)', p.r ?? 24, 1, 1000, 1, v => store.updatePathParams({ r: v })),
    rowNum('d (pen offset px)',     p.d ?? 24, 0, 2000, 0.1, v => store.updatePathParams({ d: v })),
  );

  const g2 = group('Period');
  const turnsSel = (()=> {
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent='Turns';
    const sel=document.createElement('select');
    ['auto','1','2','3','4','6','8','12'].forEach(v=>{
      const op=document.createElement('option'); op.value=v; op.textContent=v; if((p.turns??'auto').toString()===v)op.selected=true; sel.append(op);
    });
    sel.addEventListener('change', ()=>{
      const v = sel.value; store.updatePathParams({ turns: v==='auto' ? 'auto' : parseInt(v,10) });
    });
    wrap.append(lab, sel); return wrap;
  })();
  g2.append(turnsSel);

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
