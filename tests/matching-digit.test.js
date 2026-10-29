import test from 'node:test';
import assert from 'node:assert/strict';
import { createDisplayState } from '../.build/src/main.js';
import { createInitialState, reduceGame } from '../.build/src/core/game-state.js';
import { getCellModels } from '../.build/src/ui/board.js';
import { bindControls } from '../.build/src/ui/controls.js';
import { uniquePuzzle } from './fixtures/boards.js';
const playing = () => ({ ...createDisplayState(uniquePuzzle), selectedIndex: 0, assistance: { showDigitStock: false, highlightMatchingDigits: true } });
const indices = state => getCellModels(state).filter(cell=>cell.matching).map(cell=>cell.index);
const action = (state,type,fields={})=>reduceGame(state,{type,...fields});

test('clue selection matches all current values including user entries and excludes pencil marks',()=>{
  const state=playing();state.values[2]=5;state.notes[3]=new Set([5]);
  const before=JSON.stringify({...state,notes:state.notes.map(n=>[...n])});
  assert.deepEqual(indices(state),state.values.flatMap((n,i)=>n===5?[i]:[]));
  assert.ok(indices(state).includes(0));assert.ok(indices(state).includes(2));assert.ok(!indices(state).includes(3));
  assert.match(getCellModels(state)[2].label,/선택한 숫자와 같음/);
  assert.equal(JSON.stringify({...state,notes:state.notes.map(n=>[...n])}),before);
});
test('empty or null selection, OFF and non-playing states never highlight stale matches',()=>{
  const state=playing();
  for(const selectedIndex of [null,2])assert.deepEqual(indices({...state,selectedIndex}),[]);
  assert.deepEqual(indices({...state,assistance:{...state.assistance,highlightMatchingDigits:false}}),[]);
  for(const status of ['idle','generating','error','completed'])assert.deepEqual(indices({...state,status}),[]);
  assert.deepEqual(indices(createInitialState()),[]);
});
test('selection and arrow movement derive matches from the newly selected cell without changing values',()=>{
  const first=playing(),next=action(first,'MOVE_SELECTION',{direction:'right'});
  assert.equal(next.values,first.values);assert.equal(next.selectedIndex,1);
  assert.deepEqual(indices(next),first.values.flatMap((n,i)=>n===3?[i]:[]));
  const blank=action(next,'SELECT_CELL',{index:2});assert.deepEqual(indices(blank),[]);
  assert.equal(action(first,'ENTER_DIGIT',{digit:1}),first);
});
test('input and overwrite retarget matching immediately; deletion clears matches while notes stay excluded',()=>{
  let state=action(playing(),'SELECT_CELL',{index:2});
  state=action(state,'ENTER_DIGIT',{digit:5});assert.ok(indices(state).includes(0));
  state=action(state,'ENTER_DIGIT',{digit:3});assert.ok(indices(state).includes(1));assert.ok(!indices(state).includes(0));
  state=action(state,'CLEAR_CELL');assert.deepEqual(indices(state),[]);
  state=action(state,'TOGGLE_NOTE_MODE');state=action(state,'ENTER_DIGIT',{digit:5});
  assert.deepEqual(indices(state),[]);
});
test('both assistance option combinations preserve recent marker, conflicts, single selection and tab stop',()=>{
  let state=action(action(playing(),'SELECT_CELL',{index:2}),'ENTER_DIGIT',{digit:5});
  for(const showDigitStock of [false,true])for(const highlightMatchingDigits of [false,true]){
    const current={...state,assistance:{showDigitStock,highlightMatchingDigits}},cells=getCellModels(current);
    assert.equal(cells[2].recent,true);assert.equal(cells[2].conflict,true);assert.equal(cells[0].fixed,true);
    assert.equal(cells[2].matching,highlightMatchingDigits);
    assert.equal(cells.filter(c=>c.selected).length,1);assert.equal(cells.filter(c=>c.tabIndex===0).length,1);
    assert.equal(current.lastInputIndex,2);assert.equal(current.values,state.values);
  }
});
test('new game and subsequent failure reset both assistance options and remove highlights',()=>{
  const request=action(playing(),'NEW_GAME_REQUESTED',{requestId:2,difficulty:'easy'});
  assert.deepEqual(request.assistance,{showDigitStock:false,highlightMatchingDigits:false});assert.deepEqual(indices(request),[]);
  const failed=action(request,'GENERATION_FAILED',{requestId:2,code:'test',message:'retry'});
  assert.deepEqual(indices(failed),[]);assert.equal(failed.assistance.highlightMatchingDigits,false);
});
test('matching checkbox reflects state, dispatches independently, respects locks and releases listeners',()=>{
  class Checkbox extends EventTarget { checked=false;disabled=false; }
  const checkbox=new Checkbox(),events=[];
  const scope={querySelector:selector=>selector==='[data-highlight-matching-digits]'?checkbox:null};
  const controls=bindControls(scope,a=>events.push(a),async()=>{});
  controls.render(playing(),0);assert.equal(checkbox.checked,true);assert.equal(checkbox.disabled,false);
  checkbox.checked=false;checkbox.dispatchEvent(new Event('change'));
  assert.deepEqual(events,[{type:'SET_ASSISTANCE',option:'highlightMatchingDigits',enabled:false}]);
  controls.render({...playing(),status:'completed'},0);assert.equal(checkbox.disabled,true);
  checkbox.dispatchEvent(new Event('change'));assert.equal(events.length,1);
  controls.render(playing(),0);controls.dispose();checkbox.dispatchEvent(new Event('change'));assert.equal(events.length,1);
});
test('renderer rejects malformed assistance instead of silently interpreting truthy values',()=>{
  for(const assistance of [undefined,null,{}, {showDigitStock:false,highlightMatchingDigits:'yes'}])
    assert.throws(()=>getCellModels({...playing(),assistance}),TypeError);
});
