import { stockPresentationChecks } from './stock-assertions.js';
import { createInitialState } from '../../src/core/game-state.js';
import { getDigitStock } from '../../src/core/digit-stock.js';
import { mountGame } from '../../src/main.js';
import { generatePuzzle } from '../../src/core/generator.js';
import { uniquePuzzle, uniqueSolution, seededRandom } from '../fixtures/boards.js';
const root=document.querySelector('#controls-board'),scope=document.querySelector('#input-scope');
const report=document.querySelector('#controls-report'),statusElement=document.querySelector('#interaction-status');
let app,unsubscribe,resolveDelayed,mode='8';
function facts(){
 const state=app.store.getState(),enabled=state.assistance.showDigitStock;
 const buttons=[...scope.querySelectorAll('[data-digit]')];
 const reference=Array.from({length:9},(_,i)=>state.values?.filter(n=>n===i+1).length??0);
 const stock=getDigitStock(state.values);
 const checkbox=scope.querySelector('[data-show-digit-stock]');
 const measurements={
   enabled,playing:state.status==='playing',expectedCounts:reference,
   buttons:buttons.map(button=>{
     const style=getComputedStyle(button),caption=getComputedStyle(button,'::after').content;
     return {digit:Number(button.dataset.digit),label:button.getAttribute('aria-label'),remaining:button.getAttribute('data-stock-remaining'),
       exhausted:button.classList.contains('is-stock-exhausted'),disabled:button.disabled,
       captionVisible:caption!==''&&caption!=='none'&&caption!=='normal'&&caption!=='""',
       visible:style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0,
       clientWidth:button.clientWidth,clientHeight:button.clientHeight,scrollWidth:button.scrollWidth,scrollHeight:button.scrollHeight};
   }),
   helpHidden:scope.querySelector('[data-stock-help]')?.hidden,
   checkboxCount:scope.querySelectorAll('[data-show-digit-stock]').length,
   checkboxChecked:checkbox?.checked,checkboxDisabled:checkbox?.disabled,checkboxLabeled:(checkbox?.labels?.length??0)>0,
   viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
 };
 const checks={
   correctUsage:stock.length===9&&stock.every((item,i)=>item.digit===i+1&&item.usedCount===reference[i]),
   correctRemaining:stock.length===9&&stock.every(item=>item.remaining===Math.max(0,9-item.usedCount)),
   ...stockPresentationChecks(measurements),
   hiddenMatchingToggle:scope.querySelector('[data-highlight-matching-digits]')===null,
 };
 return {status:state.status,assistance:state.assistance,selectedIndex:state.selectedIndex,nine:stock[8],timer:state.timer,measurements,checks};
}
function showReport(){report.removeAttribute('data-result');report.textContent=JSON.stringify(facts(),null,2);}
function load(sample){
 unsubscribe?.();app?.dispose();resolveDelayed?.({status:'aborted'});resolveDelayed=null;mode=sample;
 let initialState;
 if(['8','9','10'].includes(sample)){
   const count=Number(sample),puzzle=Array(81).fill(0),values=Array(81).fill(0);puzzle[0]=9;values.fill(9,0,count);
   initialState={...createInitialState(),status:'playing',puzzle,values,selectedIndex:count,requestId:1,activeDifficulty:'easy',timer:{startedAtMs:performance.now(),stoppedAtMs:null}};
   initialState.notes[20]=new Set([1,9]);
 }else if(sample==='complete'){
   initialState={...createInitialState(),status:'playing',puzzle:uniquePuzzle.slice(),values:uniqueSolution.slice(),selectedIndex:2,requestId:1,activeDifficulty:'easy',timer:{startedAtMs:performance.now(),stoppedAtMs:null}};
   initialState.values[2]=0;
 }
 let calls=0;
 app=mountGame({root,scope,statusElement,initialState,generate:async(difficulty,{signal})=>{
   calls++;if(sample==='fail'&&calls===1)return {status:'failed',reason:'time-budget'};
   if(sample==='delay'&&calls===1)return new Promise(resolve=>{resolveDelayed=resolve;});
   return generatePuzzle(difficulty,{signal,rng:seededRandom(42)});
 }});
 unsubscribe=app.store.subscribe(showReport);showReport();void app.ready.then(showReport);
}
document.querySelectorAll('[data-sample]').forEach(button=>button.addEventListener('click',()=>load(button.dataset.sample)));
document.querySelector('#stock-check').addEventListener('click',()=>{const data=facts();report.textContent=JSON.stringify(data,null,2);report.dataset.result=Object.values(data.checks).every(value=>value===true)?'pass':'fail';});
document.querySelector('#resolve-delay').addEventListener('click',()=>{resolveDelayed?.({status:'success',difficulty:'easy',puzzle:uniqueSolution.map((n,i)=>i<35?0:n)});resolveDelayed=null;showReport();});
window.addEventListener('pagehide',()=>{unsubscribe?.();app?.dispose();resolveDelayed?.({status:'aborted'});},{once:true});
load(mode);
