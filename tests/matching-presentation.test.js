import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingChecks, matchingToggleCheck } from './browser/matching-assertions.js';
const toggle = (enabled=true,playing=true) => ({count:1,checked:enabled,disabled:!playing,labeled:true,enabled,playing});
const facts = () => ({expectedIndices:[0,2],toggle:toggle(),cells:Array.from({length:81},(_,index)=>({index,matching:index===0||index===2,label:[0,2].includes(index)?'선택한 숫자와 같음':'빈칸',visible:true}))});
const passes = f => Object.values(matchingChecks(f)).every(Boolean);
test('visible matching checkbox is valid ON/OFF and during gameplay locks',()=>{
  for(const enabled of [false,true])for(const playing of [false,true])assert.equal(matchingToggleCheck(toggle(enabled,playing)),true);
  for(const change of [t=>t.count=0,t=>t.count=2,t=>t.checked=false,t=>t.disabled=true,t=>t.labeled=false]){const t=toggle();change(t);assert.equal(matchingToggleCheck(t),false);}
});
test('measured matching cells pass with clues/entries and with zero matches',()=>{
  assert.ok(passes(facts()));const f=facts();f.expectedIndices=[];f.cells.forEach(c=>{c.matching=false;c.label='빈칸';});f.toggle=toggle(false);assert.ok(passes(f));
});
test('presentation rejects missing/extra/stale matching cells, labels and incomplete boards',()=>{
  for(const change of [f=>f.cells[0].matching=false,f=>f.cells[1].matching=true,f=>f.expectedIndices=[1],f=>f.cells[2].label='입력 칸',f=>f.cells.pop()]){const f=facts();change(f);assert.equal(passes(f),false);}
});
test('presentation rejects hidden matching cells and stale matching labels after clearing',()=>{
  const f=facts();f.cells[2].visible=false;assert.equal(passes(f),false);
  const cleared=facts();cleared.expectedIndices=[];cleared.cells.forEach(c=>c.matching=false);assert.equal(matchingChecks(cleared).matchingLabels,false);
});
