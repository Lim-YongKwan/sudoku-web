import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameSession } from '../src/main.js';
import { createInitialState } from '../src/core/game-state.js';
import { bindControls } from '../src/ui/controls.js';
import { uniqueSolution } from './fixtures/boards.js';

const blanks = { easy:35, normal:45, hard:50 };
// Structural response double, not a generator uniqueness proof; engine tests cover real generation.
const success = (difficulty = 'easy') => ({
  status:'success', difficulty, puzzle:uniqueSolution.map((n,i) => i < blanks[difficulty] ? 0 : n),
});
function harness(options = {}) {
  let clock = 100;
  const jobs = new Map(), displays = [], snapshots = [], requests = [];
  let serial = 0;
  const session = createGameSession({
    now:() => clock,
    schedule:(fn, delay) => { assert.equal(delay,250); jobs.set(++serial,fn); return serial; },
    cancel:(id) => jobs.delete(id),
    onElapsed:(seconds) => displays.push(seconds),
    onState:(state,seconds) => snapshots.push([state,seconds]),
    generate:(difficulty,{signal}) => new Promise((resolve,reject) => requests.push({difficulty,signal,resolve,reject})),
    ...options,
  });
  return {session,jobs,displays,snapshots,requests,setTime:(value) => {clock=value;}};
}
test('selected difficulty only affects next request; one interval survives ordinary actions', async () => {
  const h=harness(); try {
    const first=h.session.start(); h.requests[0].resolve(success()); await first;
    const board=h.session.store.getState().values;
    h.session.dispatch({type:'SET_DIFFICULTY',difficulty:'hard'});
    assert.equal(h.session.store.getState().activeDifficulty,'easy');
    assert.equal(h.session.store.getState().values,board);
    h.session.dispatch({type:'SELECT_CELL',index:0});
    assert.equal(h.jobs.size,1);
    const next=h.session.newGame();
    assert.equal(h.requests[1].difficulty,'hard');
    assert.equal(h.requests[0].signal.aborted,true);
    assert.equal(h.jobs.size,0);
    assert.equal(h.session.store.getState().values,null);
    h.session.dispatch({type:'ENTER_DIGIT',digit:4});
    assert.equal(h.session.store.getState().values,null);
    h.requests[1].resolve(success('hard')); await next;
    assert.equal(h.session.store.getState().values.filter(n=>!n).length,50);
    assert.equal(h.jobs.size,1);
  } finally {h.session.dispose();}
  assert.equal(h.jobs.size,0);
});
test('out of order and malformed stale successes never replace newer game', async () => {
  const h=harness(); try {
    const old=h.session.start(), latest=h.session.newGame();
    h.requests[1].resolve(success()); await latest;
    const state=h.session.store.getState();
    h.requests[0].resolve({status:'success',puzzle:'invalid'}); await old;
    assert.equal(h.session.store.getState(),state);
    assert.equal(state.requestId,2);
  } finally {h.session.dispose();}
});
test('stale rejection is ignored; current failure can retry and resets timer', async () => {
  const errors=[], h=harness({reportError:(e)=>errors.push(e)}); try {
    const old=h.session.start(), next=h.session.newGame();
    h.requests[0].reject(new Error('old')); await old;
    assert.equal(errors.length,0);
    h.requests[1].resolve({status:'failed',reason:'time-budget'}); await next;
    assert.equal(h.session.store.getState().status,'error');
    assert.equal(h.jobs.size,0);
    const retry=h.session.newGame(); h.setTime(5000);
    h.requests[2].resolve(success()); await retry;
    assert.equal(h.session.store.getState().timer.startedAtMs,5000);
    assert.equal(h.jobs.size,1);
  } finally {h.session.dispose();}
});
test('current unexpected error is reported with generic UI and no interval', async () => {
  const errors=[],h=harness({reportError:(e)=>errors.push(e)}); try {
    const ready=h.session.start(); h.requests[0].reject(new Error('private detail')); await ready;
    assert.equal(errors.length,1);
    assert.equal(h.session.store.getState().status,'error');
    assert.doesNotMatch(h.session.store.getState().error.message,/private detail/);
    assert.equal(h.jobs.size,0);
  } finally {h.session.dispose();}
});
test('current wrong difficulty response fails instead of leaving generating forever', async () => {
  const h=harness({reportError:()=>{}}); try {
    const ready=h.session.start(); h.requests[0].resolve(success('hard')); await ready;
    assert.equal(h.session.store.getState().status,'error');
  } finally {h.session.dispose();}
});
test('elapsed display catches up after throttled ticks and refreshes without state mutations', async () => {
  const h=harness(); try {
    const ready=h.session.start(); h.requests[0].resolve(success()); await ready;
    const state=h.session.store.getState();
    h.setTime(65100); [...h.jobs.values()][0]();
    assert.equal(h.displays.at(-1),65);
    h.setTime(70100); h.session.refreshTime();
    assert.equal(h.displays.at(-1),70);
    assert.equal(h.session.store.getState(),state);
  } finally {h.session.dispose();}
});
test('valid completion stops tick, freezes time, closes flag and locks edits', async () => {
  const initial={...createInitialState(),status:'playing',requestId:1,activeDifficulty:'easy',
    puzzle:uniqueSolution.map((n,i)=>i===2?0:n),values:uniqueSolution.map((n,i)=>i===2?0:n),
    selectedIndex:2,timer:{startedAtMs:100,stoppedAtMs:null}};
  const h=harness({initialState:initial}); try {
    await h.session.start(); assert.equal(h.jobs.size,1);
    h.setTime(62100); h.session.dispatch({type:'ENTER_DIGIT',digit:4});
    const completed=h.session.store.getState();
    assert.equal(completed.status,'completed'); assert.equal(completed.completionDialogOpen,true);
    assert.equal(h.jobs.size,0);
    h.setTime(999999); h.session.refreshTime(); assert.equal(h.displays.at(-1),62);
    h.session.dispatch({type:'CLEAR_CELL'}); assert.equal(h.session.store.getState(),completed);
    h.session.dispatch({type:'CLOSE_COMPLETION_DIALOG'});
    assert.equal(h.session.store.getState().completionDialogOpen,false);
  } finally {h.session.dispose();}
});
test('disposal aborts pending work, removes tick and ignores late responses and restarts', async () => {
  const h=harness(), ready=h.session.start(), state=h.session.store.getState();
  h.session.dispose(); h.session.dispose();
  assert.equal(h.requests[0].signal.aborted,true);
  h.requests[0].resolve(success()); await ready;
  assert.equal(h.session.store.getState(),state);
  await h.session.newGame(); h.session.refreshTime(); await h.session.start();
  assert.equal(h.requests.length,1); assert.equal(h.jobs.size,0);
});
test('repeated restart cycles never accumulate timers', async () => {
  const h=harness(); try {
    for(let i=0;i<8;i++){
      const ready=h.session.newGame(); assert.equal(h.jobs.size,0);
      h.requests[i].resolve(success()); await ready; assert.equal(h.jobs.size,1);
    }
  } finally {h.session.dispose();}
  assert.equal(h.jobs.size,0);
});

// EventTarget boundary doubles verify listener ownership/routing, not actual browser focus/modal behavior.
class Control extends EventTarget {
  value='easy'; textContent=''; open=false; focused=0;
  focus(){this.focused++;}
  showModal(){this.open=true;}
  close(){this.open=false;}
}
test('controls route change/restart, render dialog and clean up listeners', () => {
  const elements=new Map(['difficulty','new-game','elapsed','active-difficulty','completion-dialog','close-dialog','completion-time']
    .map(name=>['[data-'+name+']',new Control()]));
  const actions=[];let requests=0;
  const scope={querySelector:(selector)=>elements.get(selector)};
  const controls=bindControls(scope,a=>actions.push(a),()=>{requests++;});
  const select=elements.get('[data-difficulty]'), restart=elements.get('[data-new-game]');
  const dialog=elements.get('[data-completion-dialog]'), close=elements.get('[data-close-dialog]');
  select.value='hard'; select.dispatchEvent(new Event('change')); restart.dispatchEvent(new Event('click'));
  assert.deepEqual(actions,[{type:'SET_DIFFICULTY',difficulty:'hard'}]); assert.equal(requests,1);
  controls.render({selectedDifficulty:'normal',activeDifficulty:'easy',status:'completed',completionDialogOpen:true},65);
  assert.equal(select.value,'normal'); assert.equal(dialog.open,true); assert.equal(close.focused,1);
  assert.equal(elements.get('[data-elapsed]').textContent,'01:05');
  const cancel=new Event('cancel',{cancelable:true}); dialog.dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented,true); assert.equal(actions.at(-1).type,'CLOSE_COMPLETION_DIALOG');
  assert.equal(restart.focused,1);
  controls.render({selectedDifficulty:'normal',activeDifficulty:'easy',status:'completed',completionDialogOpen:false},65);
  assert.equal(dialog.open,false);
  controls.dispose();controls.dispose();
  restart.dispatchEvent(new Event('click'));select.dispatchEvent(new Event('change'));
  assert.equal(requests,1);assert.equal(actions.length,2);
});
test('selection during generation preserves captured normal difficulty until next new game', async () => {
  const h=harness(); try {
    h.session.dispatch({type:'SET_DIFFICULTY',difficulty:'normal'});
    const ready=h.session.start();
    h.session.dispatch({type:'SET_DIFFICULTY',difficulty:'hard'});
    h.requests[0].resolve(success('normal')); await ready;
    assert.equal(h.session.store.getState().activeDifficulty,'normal');
    assert.equal(h.session.store.getState().selectedDifficulty,'hard');
    assert.equal(h.session.store.getState().puzzle.filter(n=>n===0).length,45);
  } finally {h.session.dispose();}
});
test('aborted stale result leaves latest request generating without a failure', async () => {
  const h=harness(); try {
    const old=h.session.start(), next=h.session.newGame();
    h.requests[0].resolve({status:'aborted'}); await old;
    assert.equal(h.session.store.getState().status,'generating');
    assert.equal(h.session.store.getState().requestId,2);
    h.requests[1].resolve(success()); await next;
    assert.equal(h.session.store.getState().status,'playing');
  } finally {h.session.dispose();}
});
function controlBoundary() {
  const elements=new Map(['difficulty','new-game','elapsed','active-difficulty','completion-dialog','close-dialog','completion-time']
    .map(name=>['[data-'+name+']',new Control()]));
  return {elements,scope:{querySelector:(selector)=>elements.get(selector)}};
}
test('queued close event after reset must not dispatch or steal focus from a new game', () => {
  const {elements,scope}=controlBoundary(), actions=[];
  const controls=bindControls(scope,a=>actions.push(a),()=>{});
  const dialog=elements.get('[data-completion-dialog]'), restart=elements.get('[data-new-game]');
  try {
    controls.render({selectedDifficulty:'easy',activeDifficulty:'easy',status:'completed',completionDialogOpen:true},5);
    controls.render({selectedDifficulty:'easy',activeDifficulty:'easy',status:'generating',completionDialogOpen:false},0);
    dialog.dispatchEvent(new Event('close')); // Native close is queued after close().
    assert.equal(actions.length,0);
    assert.equal(restart.focused,0);
  } finally {controls.dispose();}
});
test('native close synchronizes state once; duplicate delayed close must not return focus again', () => {
  const {elements,scope}=controlBoundary(), actions=[];
  let controls;
  controls=bindControls(scope,a=>{
    actions.push(a);
    controls.render({selectedDifficulty:'easy',activeDifficulty:'easy',status:'completed',completionDialogOpen:false},5);
  },()=>{});
  const dialog=elements.get('[data-completion-dialog]'), restart=elements.get('[data-new-game]');
  try {
    controls.render({selectedDifficulty:'easy',activeDifficulty:'easy',status:'completed',completionDialogOpen:true},5);
    dialog.close();
    dialog.dispatchEvent(new Event('close'));
    dialog.dispatchEvent(new Event('close'));
    assert.deepEqual(actions,[{type:'CLOSE_COMPLETION_DIALOG'}]);
    assert.equal(restart.focused,1);
  } finally {controls.dispose();}
});