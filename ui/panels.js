// /ui/panels.js — Polar Harmonics panel (safe refresh + destroy())

function rowNum(labelText, value, min, max, step, onChange){
  const wrap = document.createElement('div'); wrap.className = 'row';
  const lab = document.createElement('label'); lab.textContent = labelText;
  const inp = document.createElement('input'); inp.type = 'number';
  if (min!=null) inp.min=min; if (max!=null) inp.max=max; if (step!=null) inp.step=step;
  inp.value = value;
  inp.addEventListener('input', () => onChange(parseFloat(inp.value)));
  wrap.append(lab, inp); return wrap;
}

function makeTermRow(term, onPatch, onRemove) {
  const div = document.createElement('div'); div.className = 'term';
  const a = document.createElement('input'); a.type='number'; a.step='0.1'; a.value = term.A ?? 0;
  const m = document.createElement('input'); m.type='number'; m.step='1';   m.value = term.m ?? 0;
  const phi = document.createElement('input'); phi.type='number'; phi.step='0.01'; phi.value = term.phi ?? 0;
  const del = document.createElement('button'); del.textContent='×';
  a.title='A (amplitude)'; m.title='m (integer frequency)'; phi.title='phi (radians)';

  a.addEventListener('input', ()=> onPatch({A: parseFloat(a.value)}));
  m.addEventListener('input', ()=> onPatch({m: parseInt(m.value||0,10)}));
  phi.addEventListener('input', ()=> onPatch({phi: parseFloat(phi.value)}));
  del.addEventListener('click', onRemove);

  div.append(a,m,phi,del);
  return div;
}

export function mountPolarPanel(root, store){
  root.innerHTML = '';
  const st = store.getState();

  // Shape group
  const gForm = document.createElement('div'); gForm.className='group';
  gForm.innerHTML = `<h3>Shape — Polar Harmonics</h3>`;
  gForm.append(rowNum('R0', st.params.R0, 1, 2000, 1, v => store.updatePathParams({R0:v})));

  // Terms list
  const termsBox = document.createElement('div');
  const title = document.createElement('div'); title.className='small'; title.textContent='terms: A, m (int), phi (rad)';
  const list = document.createElement('div');
  const addBtn = document.createElement('button'); addBtn.textContent = '+ add term';
  addBtn.addEventListener('click', () => {
    const p = store.getState().params;
    const next = [...(Array.isArray(p.terms)?p.terms:[]), {A:2, m:24, phi:0}];
    store.updatePathParams({ terms: next });
  });

  function refreshTerms(){
    list.innerHTML = '';
    const p = store.getState().params || {};
    const arr = Array.isArray(p.terms) ? p.terms : [];
    arr.forEach((t, idx) => {
      const row = makeTermRow(t,
        patch => {
          const now = store.getState().params || {};
          const base = Array.isArray(now.terms) ? now.terms : [];
          const next = base.map((v,i)=> i===idx ? {...v, ...patch} : v);
          store.updatePathParams({ terms: next });
        },
        () => {
          const now = store.getState().params || {};
          const base = Array.isArray(now.terms) ? now.terms : [];
          const next = base.filter((_,i)=>i!==idx);
          store.updatePathParams({ terms: next.length? next : base });
        }
      );
      list.append(row);
    });
  }
  refreshTerms();

  // subscribe only while this panel is active
  const unsubscribe = store.subscribe(() => {
    if (store.getState().method === 'polar_harmonics') refreshTerms();
  });

  termsBox.append(title, list, addBtn);
  gForm.append(termsBox);

  // AM (Amplitude Modulation)
  const gAM = document.createElement('div'); gAM.className='group';
  gAM.innerHTML = `<h3>AM (Amplitude Modulation)</h3><div class="small">scale = 1 + Σ a·cos(kθ + φ)</div>`;
  const amTerm = (store.getState().params.fm?.AM ?? [])[0] || {};
  const am_a = rowNum('a (sum)', ((store.getState().params.fm?.AM ?? []).reduce((s,t)=>s+Math.abs(t.a||0),0)).toFixed(2), 0, 1, 0.01, v=>{
    const now = store.getState().params;
    const phi = (now.fm?.AM?.[0]?.phi) ?? 0;
    const k = (now.fm?.AM?.[0]?.k) ?? 6;
    store.updatePathParams({ fm: { ...now.fm, AM: v>0 ? [{a: v, k, phi}] : [] } });
  });
  const am_k = rowNum('k (int)', (amTerm.k ?? 6), 0, 512, 1, v=>{
    const now = store.getState().params;
    const a = (now.fm?.AM?.[0]?.a) ?? 0.08;
    const phi = (now.fm?.AM?.[0]?.phi) ?? 0;
    store.updatePathParams({ fm: { ...now.fm, AM: a>0 ? [{a, k: Math.max(0, Math.round(v)), phi}] : [] } });
  });
  const am_phi = rowNum('phi (rad)', (amTerm.phi ?? 0), -6.283, 6.283, 0.01, v=>{
    const now = store.getState().params;
    const a = (now.fm?.AM?.[0]?.a) ?? 0.08;
    const k = (now.fm?.AM?.[0]?.k) ?? 6;
    store.updatePathParams({ fm: { ...now.fm, AM: a>0 ? [{a, k, phi: v}] : [] } });
  });
  gAM.append(am_a, am_k, am_phi);

  // Style & Quality
  const gStyle = document.createElement('div'); gStyle.className='group';
  gStyle.innerHTML = `<h3>Style & Quality</h3>`;
  const strokeColor = (()=> {
    const wrap = document.createElement('div'); wrap.className='row';
    const lab = document.createElement('label'); lab.textContent = 'Stroke';
    const inp = document.createElement('input'); inp.type='color'; inp.value = store.getState().stroke.color || '#9ee6ff';
    inp.addEventListener('input', ()=> store.setState({ stroke: { ...store.getState().stroke, color: inp.value }}));
    wrap.append(lab, inp); return wrap;
  })();
  const strokeWidth = rowNum('Width (px)', store.getState().stroke.width || 0.5, 0.1, 6, 0.1, v=> store.setState({ stroke: { ...store.getState().stroke, width: v }}));
  const maxAng = rowNum('Max angle (°)', store.getState().quality.maxAngleStepDeg, 0.05, 2.0, 0.05, v => store.setState({ quality: { ...store.getState().quality, maxAngleStepDeg: v }}));
  const maxSeg = rowNum('Max segment (px)', store.getState().quality.maxSegLenPx, 0.5, 6, 0.1, v => store.setState({ quality: { ...store.getState().quality, maxSegLenPx: v }}));
  gStyle.append(strokeColor, strokeWidth, maxAng, maxSeg);

  root.append(gForm, gAM, gStyle);

  // provide teardown to unsubscribe on method switch
  return { destroy(){ unsubscribe(); } };
}

