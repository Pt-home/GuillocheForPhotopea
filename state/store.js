export function createStore(initial) {
  let state = structuredClone(initial);
  const listeners = new Set();

  function getState() { return state; }
  function setState(patch) {
    state = Object.freeze({ ...state, ...patch });
    listeners.forEach(fn => fn(state));
  }
  function updatePathParams(patch) {
    state = Object.freeze({ ...state, params: { ...state.params, ...patch } });
    listeners.forEach(fn => fn(state));
  }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  return { getState, setState, updatePathParams, subscribe };
}
