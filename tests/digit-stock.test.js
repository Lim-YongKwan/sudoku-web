import test from 'node:test';
import assert from 'node:assert/strict';
import { getDigitStock } from '../.build/src/core/digit-stock.js';
import { createInitialState, createGameStore, reduceGame } from '../.build/src/core/game-state.js';
import { createGameSession, createDisplayState } from '../.build/src/main.js';
import { renderDigitStock } from '../.build/src/ui/digit-stock.js';
import { bindControls } from '../.build/src/ui/controls.js';
import { bindInput } from '../.build/src/ui/events.js';
import { uniqueSolution } from './fixtures/boards.js';

const option = (enabled, name='showDigitStock') => ({type:'SET_ASSISTANCE',option:name,enabled});
const playing = () => {
  const puzzle=Array(81).fill(0), values=Array(81).fill(0); puzzle[0]=9; values.fill(9,0,8);
  return {...createInitialState(),status:'playing',puzzle,values,selectedIndex:8,requestId:1,activeDifficulty:'easy',timer:{startedAtMs:100,stoppedAtMs:null}};
};
function presentation() {
  const buttons=Array.from({length:9},(_,i)=>{
    const attributes=new Map(),classes=new Set();
    return {dataset:{digit:String(i+1)},disabled:false,attributes,classes,
      classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)},
      setAttribute:(key,value)=>attributes.set(key,value),removeAttribute:key=>attributes.delete(key),
      hasAttribute:key=>key==='data-digit',
    };
  });
  const help={hidden:true};
  return {buttons,help,querySelectorAll:()=>buttons,querySelector:selector=>selector==='[data-stock-help]'?help:null};
}
test('stock counts values once, includes clues, excludes empty cells and notes, and returns independent results',()=>{
  const state=playing();state.notes[8]=new Set([1,9]);
  Object.freeze(state.values);
  const stock=getDigitStock(state.values);
  assert.deepEqual(stock[8],{digit:9,usedCount:8,remaining:1,exhausted:false});
  assert.equal(stock[0].usedCount,0);assert.equal(stock.reduce((sum,item)=>sum+item.usedCount,0),8);
  stock[8].usedCount=99;assert.equal(getDigitStock(state.values)[8].usedCount,8);
  assert.ok(getDigitStock(null).every(item=>item.usedCount===0&&item.remaining===9&&!item.exhausted));
});
test('stock rejects malformed boards instead of silently counting coercions',()=>{
  for(const values of [undefined,[],Array(81),Array(81).fill('9'),Array(81).fill(10)])assert.throws(()=>getDigitStock(values));
});
test('8 to 9 to 10 to 9 to 8 updates stock while exhausted buttons remain usable',()=>{
  const store=createGameStore(playing()),scope=presentation();store.dispatch(option(true));
  const verify=(used)=>{
    renderDigitStock(scope,store.getState());const button=scope.buttons[8];
    assert.equal(getDigitStock(store.getState().values)[8].usedCount,used);
    assert.equal(button.classes.has('is-stock-exhausted'),used>=9);
    assert.equal(button.attributes.get('data-stock-remaining'),String(Math.max(0,9-used)));
    assert.equal(button.disabled,false);
  };
  verify(8);store.dispatch({type:'ENTER_DIGIT',digit:9});verify(9);
  store.dispatch({type:'SELECT_CELL',index:9});store.dispatch({type:'ENTER_DIGIT',digit:9});verify(10);
  store.dispatch({type:'CLEAR_CELL'});verify(9);store.dispatch({type:'SELECT_CELL',index:8});store.dispatch({type:'CLEAR_CELL'});verify(8);
  assert.equal(store.getState().puzzle[0],9);
});
test('options are independent, immutable and do not alter gameplay or timing references',()=>{
  const before=playing();Object.freeze(before.assistance);
  const stock=reduceGame(before,option(true)),both=reduceGame(stock,option(true,'highlightMatchingDigits'));
  assert.deepEqual(before.assistance,{showDigitStock:false,highlightMatchingDigits:false});
  assert.deepEqual(stock.assistance,{showDigitStock:true,highlightMatchingDigits:false});
  assert.deepEqual(both.assistance,{showDigitStock:true,highlightMatchingDigits:true});
  for(const key of Object.keys(before).filter(key=>key!=='assistance'))assert.equal(both[key],before[key],key);
  assert.equal(reduceGame(both,option(true)),both);
  const other=reduceGame(both,option(false));assert.equal(other.assistance.highlightMatchingDigits,true);
});
test('initial and new-game state reset both options, including generation failure retries',()=>{
  const a=createInitialState(),b=createInitialState();assert.notEqual(a.assistance,b.assistance);
  assert.deepEqual(createDisplayState().assistance,{showDigitStock:false,highlightMatchingDigits:false});
  let state=reduceGame(reduceGame(playing(),option(true)),option(true,'highlightMatchingDigits'));
  state=reduceGame(state,{type:'SET_DIFFICULTY',difficulty:'hard'});assert.equal(state.assistance.showDigitStock,true);
  state=reduceGame(state,{type:'NEW_GAME_REQUESTED',requestId:2,difficulty:'hard'});
  assert.deepEqual(state.assistance,a.assistance);assert.equal(state.selectedDifficulty,'hard');
  state=reduceGame(state,{type:'GENERATION_FAILED',requestId:2,code:'budget',message:'retry'});
  state=reduceGame(state,{type:'NEW_GAME_REQUESTED',requestId:3,difficulty:'hard'});assert.deepEqual(state.assistance,a.assistance);
  assert.deepEqual(createInitialState().assistance,a.assistance);
});
test('invalid option actions and initial snapshots are rejected; options respect non-playing locks',()=>{
  const store=createGameStore(playing()),before=store.getState();
  for(const action of [option('yes'),option(true,'unknown'),{type:'SET_ASSISTANCE',option:'showDigitStock'}]){assert.throws(()=>store.dispatch(action),TypeError);assert.equal(store.getState(),before);}
  for(const assistance of [undefined,null,{showDigitStock:false},{showDigitStock:0,highlightMatchingDigits:false}])assert.throws(()=>createGameStore({...createInitialState(),assistance}),TypeError);
  for(const status of ['idle','generating','error','completed']){const state={...playing(),status};assert.equal(reduceGame(state,option(true)),state);}
});
test('store copies initial assistance and exposes readonly-by-contract snapshots without aliasing caller state',()=>{
  const initial=playing(),store=createGameStore(initial);initial.assistance.showDigitStock=true;
  assert.equal(store.getState().assistance.showDigitStock,false);
});
test('OFF removes additional stock labels and classes without changing disabled state or digits',()=>{
  const scope=presentation(),state=playing();state.values[8]=9;state.assistance={showDigitStock:true,highlightMatchingDigits:false};
  renderDigitStock(scope,state);assert.match(scope.buttons[8].attributes.get('aria-label'),/사용 9개, 남은 스톡 0개/);
  assert.equal(scope.help.hidden,false);scope.buttons[8].disabled=true;
  renderDigitStock(scope,{...state,assistance:{...state.assistance,showDigitStock:false}});
  assert.equal(scope.help.hidden,true);assert.equal(scope.buttons[8].classes.size,0);
  assert.equal(scope.buttons[8].attributes.has('data-stock-remaining'),false);
  assert.equal(scope.buttons[8].attributes.get('aria-label'),'숫자 9 입력');assert.equal(scope.buttons[8].disabled,true);
});
test('checkbox routes boolean actions, reflects state and locks, then releases its listener',()=>{
  class Checkbox extends EventTarget {checked=false;disabled=false;}
  const checkbox=new Checkbox(),scope=presentation(),query=scope.querySelector;
  scope.querySelector=selector=>selector==='[data-show-digit-stock]'?checkbox:query(selector);
  const actions=[],controls=bindControls(scope,action=>actions.push(action),async()=>{});
  const state=playing();controls.render(state,0);assert.equal(checkbox.checked,false);
  checkbox.checked=true;checkbox.dispatchEvent(new Event('change'));assert.deepEqual(actions,[option(true)]);
  for(const status of ['generating','completed','error']){controls.render({...state,status},0);assert.equal(checkbox.disabled,true);checkbox.dispatchEvent(new Event('change'));}
  assert.equal(actions.length,1);controls.render(state,0);controls.dispose();controls.dispose();checkbox.dispatchEvent(new Event('change'));assert.equal(actions.length,1);
});
test('an exhausted digit click still routes input; only the existing disabled lock blocks it',()=>{
  const store=createGameStore(playing());store.dispatch(option(true));store.dispatch({type:'ENTER_DIGIT',digit:9});store.dispatch({type:'SELECT_CELL',index:9});
  const scope=presentation();renderDigitStock(scope,store.getState());
  const button=scope.buttons[8];
  class Root extends EventTarget {
    closest(selector){return selector.startsWith('.sudoku-cell')?null:selector==='[data-digit], [data-input-action]'?button:null;}
    contains(node){return node===button;}
    querySelector(){return {focus(){}};}
  }
  const root=new Root(),unbind=bindInput(root,store.dispatch);root.dispatchEvent(new Event('click'));
  assert.equal(getDigitStock(store.getState().values)[8].usedCount,10);
  button.disabled=true;store.dispatch({type:'SELECT_CELL',index:10});root.dispatchEvent(new Event('click'));assert.equal(store.getState().values[10],0);unbind();
});
test('assistance changes leave a live session timer running and new-game failure clears options',async()=>{
  let intervals=0,cancels=0;
  const session=createGameSession({initialState:playing(),now:()=>1000,schedule:()=>++intervals,cancel:()=>cancels++,generate:async()=>({status:'failed',reason:'time-budget'})});
  try{await session.start();const timer=session.store.getState().timer;
    session.dispatch(option(true));session.dispatch(option(true,'highlightMatchingDigits'));session.dispatch({type:'SET_DIFFICULTY',difficulty:'normal'});
    assert.equal(intervals,1);assert.equal(cancels,0);assert.equal(session.store.getState().timer,timer);
    await session.newGame();assert.equal(cancels,1);assert.equal(session.store.getState().status,'error');
    assert.deepEqual(session.store.getState().assistance,{showDigitStock:false,highlightMatchingDigits:false});
    assert.equal(session.store.getState().selectedDifficulty,'normal');
  }finally{session.dispose();}
});
