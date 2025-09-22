// /ui/panels_rose_mix.js — UI for Rose Mix (double rhodonea)

export function mountRoseMixPanel(root, store){
  root.innerHTML = '';
  const p = store.getState().params;

  const group = (t)=>{ const g=document.createElement('div'); g.className='group'; g.innerHTML=`<h3>${t}</h3>`; return g; };
  const rowNum = (label, val, min, max, step, onChange)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const inp=document.createElement('input'); inp.type='number';
    if(min!=null)inp.min=min; if(max!=null)inp.max=max; if(step!=null)inp.step=step;
    inp.value=val; inp.addEventListener('input', ()=> onChange(parseFloat(inp.value)));
    wrap.append(lab, inp); return wrap;
  };
  const rowSel = (label, val, options, onChange)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const sel=document.createElement('select');
    options.forEach(o=>{ const op=document.createElement('option'); op.value=o; op.textContent=o; if(o===val)op.selected=true; sel.append(op); });
    sel.addEventListener('change', ()=> onChange(sel.value));
    wrap.append(lab, sel); return wrap;
  };

  function ensureTerm(idx){
    const now = store.getState().params;
    const tkey = idx===1 ? 'term1' : 'term2';
    const def = idx===1
      ? { A:120, k:5, phi:0, variant:'cos' }
      : { A:60,  k:9, phi:Math.PI/6, variant:'cos' };
    return now[tkey] ?? def;
  }

  function termGroup(idx, title){
    const t = ensureTerm(idx);
    const g = group(title);
    g.append(
      rowNum('A (amplitude px)', t.A ?? 120, 0, 2000, 0.1, v=>{
        const key = idx===1 ? 'term1' : 'term2';
        const now = store.getState().params[key] || {};
        store.updatePathParams({ [key]: { ...now, A: v } });
      }),
      rowNum('k (petal freq)', t.k ?? 5, 0, 64, 0.1, v=>{
        const key = idx===1 ? 'term1' : 'term2';
        const now = store.getState().params[key] || {};
        store.updatePathParams({ [key]: { ...now, k: v } });
      }),
      rowNum('phi (rad)', t.phi ?? 0, -Math.PI*2, Math.PI*2, 0.01, v=>{
        const key = idx===1 ? 'term1' : 'term2';
        const now = store.getState().params[key] || {};
        store.updatePathParams({ [key]: { ...now, phi: v } });
      }),
      rowSel('Variant', t.variant || 'cos', ['cos','sin'], v=>{
        const key = idx===1 ? 'term1' : 'term2';
        const now = store.getState().params[key] || {};
        store.updatePathParams({ [key]: { ...now, variant: v } });
      })
    );
    return g;
  }

  const g1 = termGroup(1, 'Term 1');
  const g2 = termGroup(2, 'Term 2');

  const g3 = group('Global');
  g3.append(
    rowSel('Turns', (p.turns ?? 'auto').toString(), ['auto','1','2','3','4','6','8','12'], v=>{
      store.updatePathParams({ turns: v==='auto' ? 'auto' : parseInt(v,10) });
    }),
    rowNum('Rotate (rad)', p.rot ?? 0, -Math.PI*2, Math.PI*2, 0.01, v=>{
      store.updatePathParams({ rot: v });
    })
  );

  const g4 = group('Style & Quality');
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
    inp.value = store.getState().stroke.width || 0.5;
    inp.addEventListener('input', ()=> store.setState({ stroke: { ...store.getState().stroke, width: parseFloat(inp.value) }}));
    w.append(lab,inp); return w;
  })();

  g4.append(strokeColor, widthRow,
    mkQ('Max angle (°)', 'maxAngleStepDeg', 0.05, 2.0, 0.05),
    mkQ('Max segment (px)', 'maxSegLenPx', 0.5, 6, 0.1)
  );

  root.append(g1, g2, g3, g4);
  return { destroy(){} };
}

