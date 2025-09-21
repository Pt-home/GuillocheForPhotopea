export function mountTrochoidPanel(root, store){
  root.innerHTML = '';
  const st = store.getState();
  const p  = st.params;

  const group = (title) => {
    const g=document.createElement('div'); g.className='group';
    g.innerHTML = `<h3>${title}</h3>`; return g;
  };
  const rowNum = (label, val, min, max, step, onChange)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const inp=document.createElement('input'); inp.type='number';
    if(min!=null)inp.min=min; if(max!=null)inp.max=max; if(step!=null)inp.step=step;
    inp.value=val; inp.addEventListener('input',()=>onChange(parseFloat(inp.value)));
    wrap.append(lab,inp); return wrap;
  };
  const rowSelect=(label, val, options, onChange)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const sel=document.createElement('select');
    options.forEach(o=>{ const opt=document.createElement('option'); opt.value=o; opt.textContent=o; if(o===val)opt.selected=true; sel.append(opt); });
    sel.addEventListener('change',()=>onChange(sel.value)); wrap.append(lab,sel); return wrap;
  };

  // Method header
  const g1 = group('Trochoid / Spirograph');
  g1.append(
    rowSelect('Kind', p.kind || 'hypotrochoid', ['hypotrochoid','epitrochoid'], v => store.updatePathParams({ kind:v })),
    rowNum('R (base)', p.R ?? 140, 1, 5000, 1, v => store.updatePathParams({ R:v })),
    rowNum('r (rolling)', p.r ?? 37, 1, 5000, 1, v => store.updatePathParams({ r:v })),
    rowNum('d (pen offset)', p.d ?? 18, 0, 5000, 0.1, v => store.updatePathParams({ d:v }))
  );

  // Period / turns
  const g2 = group('Period & Turns');
  const turnsRow = rowSelect('Turns', (p.turns ?? 'auto').toString(), ['auto','1','2','3','4','6','8','12'], v=>{
    const t = (v==='auto') ? 'auto' : parseInt(v,10);
    store.updatePathParams({ turns: t });
  });
  g2.append(turnsRow);

  // Style & Quality (reuse global)
  const g3 = group('Style & Quality');
  const strokeColor = (()=> {
    const wrap = document.createElement('div'); wrap.className='row';
    const lab = document.createElement('label'); lab.textContent = 'Stroke';
    const inp = document.createElement('input'); inp.type='color'; inp.value = store.getState().stroke.color || '#9ee6ff';
    inp.addEventListener('input', ()=> store.setState({ stroke: { ...store.getState().stroke, color: inp.value }}));
    wrap.append(lab, inp); return wrap;
  })();
  const rowNum2 = (label, key, min,max,step)=>{
    return rowNum(label, store.getState().quality[key], min,max,step, v=> store.setState({ quality: { ...store.getState().quality, [key]: v }}));
  };
  g3.append(
    strokeColor,
    rowNum('Width (px)', store.getState().stroke.width || 1.2, 0.1, 6, 0.1, v=> store.setState({ stroke: { ...store.getState().stroke, width: v }})),
    rowNum2('Max angle (°)', 'maxAngleStepDeg', 0.05, 2.0, 0.05),
    rowNum2('Max segment (px)', 'maxSegLenPx', 0.5, 6, 0.1),
  );

  root.append(g1,g2,g3);
}
