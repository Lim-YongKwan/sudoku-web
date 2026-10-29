import test from 'node:test';
import assert from 'node:assert/strict';
import { stockPresentationChecks } from './browser/stock-assertions.js';
const all = facts => Object.values(stockPresentationChecks(facts)).every(value => value === true);
function facts(enabled=true,playing=true){
 const expectedCounts=[0,0,0,0,0,0,0,0,9];
 return {enabled,playing,expectedCounts,helpHidden:!enabled,checkboxCount:1,checkboxChecked:enabled,checkboxDisabled:!playing,checkboxLabeled:true,viewport:320,scrollWidth:320,
   buttons:expectedCounts.map((used,i)=>({digit:i+1,label:enabled?'숫자 '+(i+1)+' 입력, 사용 '+used+'개, 남은 스톡 '+Math.max(0,9-used)+'개':'숫자 '+(i+1)+' 입력',
     remaining:enabled?String(Math.max(0,9-used)):null,exhausted:enabled&&used>=9,disabled:!playing,captionVisible:enabled,visible:true,clientWidth:25,clientHeight:44,scrollWidth:25,scrollHeight:44}))};
}
test('stock presentation accepts measured ON/OFF and locked/unlocked states',()=>{
 for(const enabled of [false,true])for(const playing of [false,true])assert.equal(all(facts(enabled,playing)),true);
});
test('missing or duplicate pad buttons and invalid reference counts cannot pass',()=>{
 for(const mutate of [s=>s.buttons=[],s=>s.buttons.pop(),s=>s.buttons[8].digit=8,s=>s.expectedCounts=[],s=>s.expectedCounts[0]=NaN]){const sample=facts();mutate(sample);assert.equal(all(sample),false);}
});
test('caption loss, clipping, hidden controls, missing labels and stale OFF help are failures',()=>{
 for(const change of [{captionVisible:false},{visible:false},{scrollWidth:40},{scrollHeight:60},{clientWidth:0},{label:'9'},{disabled:true}]){const sample=facts();Object.assign(sample.buttons[8],change);assert.equal(all(sample),false);}
 for(const change of [{checkboxCount:0},{checkboxLabeled:false},{viewport:0},{scrollWidth:321}])assert.equal(all({...facts(),...change}),false);
 assert.equal(all({...facts(false),helpHidden:false}),false);
});
