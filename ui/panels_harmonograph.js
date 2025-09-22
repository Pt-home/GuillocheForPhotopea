// /ui/panels_harmonograph.js — Harmonograph UI panel

export function mountHarmonographPanel(root, store){
  root.innerHTML = '';
  const p = store.getState().params;

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
  const makeTerm = (fields, term, onPatch, onRemove) => {
    const div = document.createElement('div'); div.className='term';
    const inputs = {};
    fields.forEach(f => {
      const inp = document.createElement('input');
      inp.type = 'number'; inp.step = f.step ?? '0.01';
      inp.value = (term[f.key] ?? f.def);
      inp.title = f.label;
      inp.addEventListener('input', ()=> onPatch({ [f.key]: parseFloat(inp.value) }));
      inputs[f.key] = inp;
      div.append(inp);
    });
    const del = document.createElement('button'); del.textContent='×';
    del.addEventListener('click', onRemove);
    div.append(del);
    return div;
  };

  // X terms (A, omega, phi, decay)
  const xGroup = group('X terms — x(t) = Σ A·e^{-d t}·sin(ω t + φ)');
  const xList = document.createElement('div');
  const addX = document.createElement('button'); addX.textContent = '+ add X term';
  const xFields = [
    {key:'A',     label:'A',     def:120, step:'0.1'},
    {key:'omega', label:'omega', def:2.0, step:'0.01'},
    {key:'phi',   label:'phi',   def:0,   step:'0.01'},
    {key:'decay', label:'decay', def:0.005, step:'0.0005'}
  ];
  function refreshX(){
    xList.innerHTML='';
    const arr = Array.isArray(store.getState().params.x_terms) ? store.getState().params.x_terms : [];
    arr.forEach((t, idx)=>{
      const row = makeTerm(xFields, t,
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
      xList.append(row);
    });
  }
  addX.addEventListener('click', ()=>{
    const now = store.getState().params;
    const base = Array.isArray(now.x_terms)? now.x_terms : [];
    store.updatePathParams({ x_terms: [...base, {A:80,omega:3,phi:0,decay:0.006}] });
  });
  refreshX();

  xGroup.append(xList, addX);

  // Y terms (B, nu, psi, decay)
  const yGroup = group('Y terms — y(t) = Σ B·e^{-d t}·sin(ν t + ψ)');
  const yList = document.createElement('div');
  const addY = document.createElement('button'); addY.textContent = '+ add Y term';
  const yFields = [
    {key:'B',   label:'B',   def:120, step:'0.1'},
    {key:'nu',  label:'nu',  def:2.7, step:'0.01'},
    {key:'psi', label:'psi', def:0,   step:'0.01'},
    {key:'decay', label:'decay', def:0.006, step:'0.0005'}
  ];
  function refreshY(){
    yList.innerHTML='';
    const arr = Array.isArray(store.getState().params.y_terms) ? store.getState().params.y_terms : [];
    arr.forEach((t, idx)=>{
      const row = makeTerm(yFields, t,
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
      yList.append(row);
    });
  }
  addY.addEventListener('click', ()=>{
    const now = store.getState().params;
    const base = Array.isArray(now.y_terms)? now.y_terms : [];
    store.updatePathParams({ y_terms: [...base, {B:70,nu:4.2,psi:0,decay:0.007}] });
  });
  refreshY();

  yGroup.append(yList, addY);

  // Time window
  const tGroup = group('Time window');
  const tStart = rowNum('t start', p.t?.start ?? 0, 0, 1e6, 1, v=>{
    const now = store.getState().params;
    store.updatePathParams({ t: { ...(now.t||{}), start: v } });
  });
  const tEnd = rowNum('t end', p.t?.end ?? 800, 10, 1e6, 1, v=>{
    const now = store.getState().params;
    store.updatePathParams({ t: { ...(now.t||{}), end: Math.max(v, (now.t?.start??0) + 10) } });
  });
  tGroup.append(tStart, tEnd);

  // Style & Quality
  const qGroup = group('Style & Quality');
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
  qGroup.append(
    strokeColor,
    rowNum('Width (px)', store.getState().stroke.width || 0.5, 0.1, 6, 0.1, v=> store.setState({ stroke: { ...store.getState().stroke, width: v }})),
    rowNum2('Max angle (°)', 'maxAngleStepDeg', 0.05, 2.0, 0.05),
    rowNum2('Max segment (px)', 'maxSegLenPx', 0.5, 6, 0.1),
  );

  // Subscribe to rebuild lists when state changes & this panel active
  const unsubscribe = store.subscribe(()=>{
    if (store.getState().method === 'harmonograph') { refreshX(); refreshY(); }
  });

  root.append(xGroup, yGroup, tGroup, qGroup);
  return { destroy(){ unsubscribe(); } };
}

