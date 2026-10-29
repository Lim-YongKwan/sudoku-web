import { uniquePuzzle, uniqueSolution, seededRandom } from '../fixtures/boards.js';
import { createInitialState } from '../../src/core/game-state.js';
import { generatePuzzle } from '../../src/core/generator.js';
import { mountGame } from '../../src/main.js';

const root = document.querySelector('#controls-board');
const scope = document.querySelector('#input-scope');
const statusElement = document.querySelector('#interaction-status');
const report = document.querySelector('#controls-report');
let app, unsubscribe, resolveDelayed;
function showReport() {
  const state = app.store.getState();
  report.textContent = JSON.stringify({
    status:state.status, requestId:state.requestId,
    assistance:state.assistance,
    matchingCount:root.querySelectorAll('.is-matching').length,
    lastInputIndex:state.lastInputIndex,
    recentCount:root.querySelectorAll('.is-last-input').length,
    selectedDifficulty:state.selectedDifficulty, activeDifficulty:state.activeDifficulty,
    blankCount:state.puzzle?.filter(n=>n===0).length, timer:state.timer,
    completionDialogOpen:state.completionDialogOpen,
    dialogOpen:scope.querySelector('dialog').open,
    pendingSignalAborted:pendingSignal?.aborted ?? null,
  },null,2);
}
let pendingSignal;
function load(mode = 'real') {
  unsubscribe?.(); app?.dispose(); resolveDelayed = null; pendingSignal = null;
  let calls = 0;
  const initial = mode === 'complete' ? {
    ...createInitialState(),status:'playing',puzzle:uniquePuzzle.slice(),values:uniqueSolution.slice(),
    selectedIndex:2,activeDifficulty:'easy',requestId:1,
    timer:{startedAtMs:performance.now(),stoppedAtMs:null},
  } : undefined;
  if(initial) initial.values[2]=0;
  app=mountGame({root,scope,statusElement,initialState:initial,
    generate:async(difficulty,{signal})=>{
      calls++;
      if(mode==='fail' && calls===1) return {status:'failed',reason:'time-budget'};
      if(mode==='delay' && calls===1) {
        pendingSignal=signal;
        // Deliberately ignores cancellation to verify stale-response protection.
        return new Promise(resolve=>{resolveDelayed=resolve;});
      }
      return generatePuzzle(difficulty,{signal,rng:seededRandom(42)});
    },
  });
  unsubscribe=app.store.subscribe(showReport);
  showReport();
  void app.ready.then(showReport);
}
document.querySelector('#load-input').addEventListener('click',()=>load());
document.querySelector('#load-complete').addEventListener('click',()=>load('complete'));
document.querySelector('#load-failure').addEventListener('click',()=>load('fail'));
document.querySelector('#load-delay').addEventListener('click',()=>load('delay'));
document.querySelector('#resolve-delay').addEventListener('click',()=>{
  resolveDelayed?.({status:'success',difficulty:'easy',puzzle:uniquePuzzle.slice()});
  resolveDelayed=null;
  showReport();
});
window.addEventListener('pagehide',()=>{unsubscribe?.();app?.dispose();resolveDelayed?.({status:'aborted'});},{once:true});
load();