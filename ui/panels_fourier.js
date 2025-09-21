// /ui/panels_fourier.js — Fourier Epicycles UI

export function mountFourierPanel(root, store){
  root.innerHTML = '';
  const group = (title) => { const g=document.createElement('div'); g.className='group'; g.innerHTML = `<h3>${title}</h3>`; return g; };

  // helpers
  const makeNum = (val, step='0.01')=>{ const i=document.createElement('input'); i.type='number'; i.step=step; i.value=val; return i; };
  const makeSel = (val, opts)=>{ const s=document.createElement('select'); opts.forEach(o=>{ const op=document.createElement('option'); op.value=o; op.textContent=o; if(o===val)op.selected=true; s.append(op); }); return s; };

  function makeRow(term, onPatch, onRemove){
    const row = document.createElement('div'); row.className='term';
    const kind = makeSel(term.kind || 'cos', ['cos','sin']);
    const amp  = makeNum(term.amp ?? 50, '0.1');
    const freq = makeNum(term.freq ?? 1, '0.1');
    const ph   = makeNum(term.phase ?? 0, '0.01');
    const del  = document.createElement('button'); del.textContent = '×';
    kind.title='kind'; amp.title='amp'; freq.title='freq'; ph.title='phase';
    kind.addEventListener('change', ()=> onPatch({kind: kind.value}));
    amp .addEventListener('input',  ()=> onPatch({amp:  parseFloat(amp.value)}));
    freq.addEventListener('input',  ()=> onPatch({freq: parseFloat(freq.value)}));
    ph  .addEventListener('input',  ()=> onPatch({phase:parseFloat(ph.value)}));
    del .addEventListener('click',  onRemove);
    row.append(kind, amp, freq, ph, del);
    return row;
  }

  // X series
  const gx = group('X(t) terms');
  const listX = document.createElement('div');
  const addX  = document.createElement('button'); addX.textContent = '+ add X term';
  function refreshX(){
    listX.innerHTML='';
    const arr = Array.isArray(store.getState().params.x_terms) ? store.getState().params.x_terms : [];
    arr.forEach((t, idx)=>{
      const row = makeRow(t,
        patch=>{
          const now = store.getState().params;
          const base = Array.isArray(now.x_terms)? now.x_terms : [];
          const next = base.map((v,i)=> i===idx ? {...v, ...patch} : v);
          store.updatePathParams({ x_terms: next });
        },
        ()=>{
          const now = store.getState().params;
          const base = Array.isArray(now.x_terms)? now.x_terms : [];
          const next = base.filter((_,i)=> i!==idx);
          store.updatePathParams({ x_terms: next });
        }
      );
      listX.append(row);
    });
  }
  addX.addEventListener('click', ()=>{
    const now = store.getState().params;
    const base = Array.isArray(now.x_terms)? now.x_terms : [];
    store.updatePathParams({ x_terms: [...base, { kind:'cos', amp:40, freq:3, phase:0 }] });
  });
  gx.append(listX, addX);

  // Y series
  const gy = group('Y(t) terms');
  const listY = document.createElement('div');
  const addY  = document.createElement('button'); addY.textContent = '+ add Y term';
  function refreshY(){
    listY.innerHTML='';
    const arr = Array.isArray(store.getState().params.y_terms) ? store.getState().params.y_terms : [];
    arr.forEach((t, idx)=>{
      const row = makeRow(t,
        patch=>{
          const now = store.getState().params;
          const base = Array.isArray(now.y_terms)? now.y_terms : [];
          const next = base.map((v,i)=> i===idx ? {...v, ...patch} : v);
          store.updatePathParams({ y_terms: next });
        },
        ()=>{
          const now = store.getState().params;
          const base = Array.isArray(now.y_terms)? now.y_terms : [];
          const next = base.filter((_,i)=> i!==idx);
          store.updatePathParams({ y_terms: next });
        }
      );
      listY.append(row);
    });
  }
  addY.addEventListener('click', ()=>{
    const now = store.getState().params;
    const base = Array.isArray(now.y_terms)? now.y_terms : [];
    store.updatePathParams({ y_terms: [...base, { kind:'sin', amp:40, freq:5, phase:0 }] });
  });
  gy.append(listY, addY);

  // Center & Period
  const gC = group('Center & Period');
  const cxRow = document.createElement('div'); cxRow.className='row';
  cxRow.innerHTML = `<label>Center X</label>`;
  const cx = makeNum((store.getState().params.center?.x ?? 0), '0.1');
  cx.addEventListener('input', ()=> {
    const c = store.getState().params.center || {x:0,y:0};
    store.updatePathParams({ center: { ...c, x: parseFloat(cx.value) } });
  });
  cxRow.append(cx);
  const cyRow = document.createElement('div'); cyRow.className='row';
  cyRow.innerHTML = `<label>Center Y</label>`;
  const cy = makeNum((store.getState().params.center?.y ?? 0), '0.1');
  cy.addEventListener('input', ()=> {
    const c = store.getState().params.center || {x:0,y:0};
    store.updatePathParams({ center: { ...c, y: parseFloat(cy.value) } });
  });
  cyRow.append(cy);

  const turnsRow = document.createElement('div'); turnsRow.className='row';
  turnsRow.innerHTML = `<label>Turns</label>`;
  const turnsSel = makeSel((store.getState().params.turns ?? 'auto').toString(), ['auto','1','2','3','4','6','8','12']);
  turnsSel.addEventListener('change', ()=>{
    const v = turnsSel.value; const t = (v==='auto') ? 'auto' : parseInt(v,10);
    store.updatePathParams({ turns: t });
  });
  turnsRow.append(turnsSel);
  gC.append(cxRow, cyRow, turnsRow);

  // Style & Quality
  const gSQ = group('Style & Quality');
  const strokeColor = (()=> {
    const wrap = document.createElement('div'); wrap.className='row';
    const lab = document.createElement('label'); lab.textContent = 'Stroke';
    const inp = document.createElement('input'); inp.type='color'; inp.value = store.getState().stroke.color || '#9ee6ff';
    inp.addEventListener('input', ()=> store.setState({ stroke: { ...store.getState().stroke, color: inp.value }}));
    wrap.append(lab, inp); return wrap;
  })();
  const mkRowNum = (label, key, min,max,step, def)=>{
    const wrap=document.createElement('div'); wrap.className='row';
    const lab=document.createElement('label'); lab.textContent=label;
    const inp=document.createElement('input'); inp.type='number';
    inp.min=min; inp.max=max; inp.step=step; inp.value = (store.getState().quality[key] ?? def);
    inp.addEventListener('input', ()=> store.setState({ quality: { ...store.getState().quality, [key]: parseFloat(inp.value) }}));
    wrap.append(lab,inp); return wrap;
  };
  gSQ.append(
    strokeColor,
    (()=>{ const w=document.createElement('div'); w.className='row';
      const lab=document.createElement('label'); lab.textContent='Width (px)';
      const inp=document.createElement('input'); inp.type='number'; inp.min='0.1'; inp.max='6'; inp.step='0.1';
      inp.value = store.getState().stroke.width || 1.2;
      inp.addEventListener('input', ()=> store.setState({ stroke: { ...store.getState().stroke, width: parseFloat(inp.value) }}));
      w.append(lab,inp); return w; })(),
    mkRowNum('Max angle (°)', 'maxAngleStepDeg', 0.05, 2.0, 0.05, 0.35),
    mkRowNum('Max segment (px)', 'maxSegLenPx', 0.5, 6, 0.1, 2.0)
  );

  // subscribe for dynamic refresh of term lists
  const unsub = store.subscribe(()=>{
    if (store.getState().method === 'fourier'){
      refreshX(); refreshY();
    }
  });

  refreshX(); refreshY();
  root.append(gx, gy, gC, gSQ);
  return { destroy(){ unsub(); } };
}
