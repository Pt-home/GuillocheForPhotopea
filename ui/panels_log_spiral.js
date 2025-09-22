// /ui/panels_log_spiral.js — Logarithmic Spiral UI

export function mountLogSpiralPanel(root, store){
  root.innerHTML = '';
  const p = store.getState().params;

  const group = (title) => { const g=document.createElement('div'); g.className='group'; g.innerHTML=`<h3>${title}</h3>`; return g; };
  const rowNum = (label, val, min, max, step, onChange)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const inp=document.createElement('input'); inp.type='number';
    if(min!=null)inp.min=min; if(max!=null)inp.max=max; if(step!=null)inp.step=step;
    inp.value=val; inp.addEventListener('input',()=>onChange(parseFloat(inp.value)));
    wrap.append(lab,inp); return wrap;
  };
  const rowSelect = (label, val, options, onChange)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const sel=document.createElement('select');
    options.forEach(o=>{ const op=document.createElement('option'); op.value=o; op.textContent=o; if(o===val)op.selected=true; sel.append(op); });
    sel.addEventListener('change',()=>onChange(sel.value));
    wrap.append(lab, sel); return wrap;
  };

  // Base params
  const g1 = group('Log Spiral');
  g1.append(
    rowNum('a (base radius)', p.a ?? 2.0, 0.01, 1e6, 0.01, v => store.updatePathParams({ a: Math.max(0.01, v) })),
    rowNum('b (growth)',      p.b ?? 0.12, -2, 2, 0.001, v => store.updatePathParams({ b: v })),
    rowNum('theta0 (rad)',    p.theta0 ?? 0, -6.283, 6.283, 0.01, v => store.updatePathParams({ theta0: v })),
    rowSelect('Turns', (p.turns ?? 6).toString(), ['1','2','3','4','6','8','12'], v=>{
      store.updatePathParams({ turns: parseInt(v,10) });
    })
  );

  // AM terms (radial wobble)
  const g2 = group('Radial AM (r *= 1 + Σ a·cos(k·t + φ))');
  const list = document.createElement('div');
  const add  = document.createElement('button'); add.textContent = '+ add AM term';

  function makeRow(term, idx){
    const row = document.createElement('div'); row.className='term';
    const aInp = document.createElement('input'); aInp.type='number'; aInp.step='0.01'; aInp.value=term.a ?? 0.12; aInp.title='a (amplitude)';
    const kInp = document.createElement('input'); kInp.type='number'; kInp.step='1';    kInp.value=term.k ?? 6;    kInp.title='k (frequency)';
    const pInp = document.createElement('input'); pInp.type='number'; pInp.step='0.01'; pInp.value=term.phi ?? 0;  pInp.title='phi (rad)';
    const del  = document.createElement('button'); del.textContent='×';

    const patch = ()=>{
      const now = store.getState().params;
      const base = Array.isArray(now.AM)? now.AM : [];
      const next = base.map((t,i)=> i===idx ? {
        a: parseFloat(aInp.value), k: parseFloat(kInp.value), phi: parseFloat(pInp.value)
      } : t);
      store.updatePathParams({ AM: next });
    };
    aInp.addEventListener('input', patch);
    kInp.addEventListener('input', patch);
    pInp.addEventListener('input', patch);
    del.addEventListener('click', ()=>{
      const now = store.getState().params;
      const base = Array.isArray(now.AM)? now.AM : [];
      const next = base.filter((_,i)=> i!==idx);
      store.updatePathParams({ AM: next });
    });

    row.append(aInp, kInp, pInp, del);
    return row;
  }

  function refreshList(){
    list.innerHTML = '';
    const arr = Array.isArray(store.getState().params.AM) ? store.getState().params.AM : [];
    arr.forEach((t, idx)=> list.append(makeRow(t, idx)));
  }

  add.addEventListener('click', ()=>{
    const now = store.getState().params;
    const base = Array.isArray(now.AM)? now.AM : [];
    store.updatePathParams({ AM: [...base, { a: 0.08, k: 8, phi: 0 }] });
  });
  g2.append(list, add);

  // Style & Quality
  const g3 = group('Style & Quality');
  const strokeColor = (()=> {
    const wrap = document.createElement('div'); wrap.className='row';
    const lab = document.createElement('label'); lab.textContent = 'Stroke';
    const inp = document.createElement('input'); inp.type='color'; inp.value = store.getState().stroke.color || '#9ee6ff';
    inp.addEventListener('input', ()=> store.setState({ stroke: { ...store.getState().stroke, color: inp.value }}));
    wrap.append(lab, inp); return wrap;
  })();
  const mkRowQ = (label, key, min,max,step)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const inp=document.createElement('input'); inp.type='number';
    inp.min=min; inp.max=max; inp.step=step; inp.value = store.getState().quality[key];
    inp.addEventListener('input', ()=> store.setState({ quality: { ...store.getState().quality, [key]: parseFloat(inp.value) }}));
    wrap.append(lab,inp); return wrap;
  };
  const widthRow = (()=> {
    const w=document.createElement('div'); w.className='row';
    const lab=document.createElement('label'); lab.textContent='Width (px)';
    const inp=document.createElement('input'); inp.type='number'; inp.min='0.1'; inp.max='6'; inp.step='0.1';
    inp.value = store.getState().stroke.width || 0.5;
    inp.addEventListener('input', ()=> store.setState({ stroke: { ...store.getState().stroke, width: parseFloat(inp.value) }}));
    w.append(lab,inp); return w;
  })();

  g3.append(strokeColor, widthRow,
    mkRowQ('Max angle (°)', 'maxAngleStepDeg', 0.05, 2.0, 0.05),
    mkRowQ('Max segment (px)', 'maxSegLenPx', 0.5, 6, 0.1),
  );

  // subscribe so the AM list redraws after updates
  const unsub = store.subscribe(()=>{
    if (store.getState().method === 'log_spiral') refreshList();
  });

  refreshList();
  root.append(g1, g2, g3);
  return { destroy(){ unsub(); } };
}

