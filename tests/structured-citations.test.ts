import test from 'node:test';
import assert from 'node:assert/strict';
import {validateIntricDraft} from '../src/lib/structured-citations';
import {validateEvidence} from '../src/lib/schema';
import {patients} from '../src/lib/fixtures';
const text='Structured source: clinical/laakitys\nvaikuttava_aine: "Example substance"\natc_koodi: "EXAMPLE"\nlaakkeen_kayttotapa: "TARVITTAESSA"';
const med={...patients[0].records[0],id:'authored-medication',sourceTable:'clinical/laakitys',text};
const patient={...patients[0],records:[med]};
const quote='vaikuttava_aine: "Example substance"\nlaakkeen_kayttotapa: "TARVITTAESSA"';
const draft=(value=quote)=>({facts:[{title:'Authored medication',text:'Recorded substance; current use unconfirmed.',status:'documented',evidence:[{sourceId:med.id,quote:value}]}],questions:[],missing:[{title:'Current use',status:'unclear',explanation:'Current use is not established.',question:'Are you currently using this medicine?'}]});
test('nonadjacent exact medication fields become one contiguous original excerpt',()=>{
 const input=draft();const before=structuredClone(input);
 assert.throws(()=>validateEvidence(input,patient),/Invalid evidence/);
 const result=validateIntricDraft(input,patient);
 assert.equal(result.restoredSourceExcerpts,1);assert.ok(result.content.facts[0].evidence[0].quote.includes('atc_koodi: "EXAMPLE"'));
 assert.ok(med.text.includes(result.content.facts[0].evidence[0].quote));assert.deepEqual(input,before);assert.equal(patient.records[0].text,text);
});
test('recovery never accepts changed values, removed quotes, reordered fields or another source',()=>{
 for(const invalid of [quote.replace('Example substance','Different substance'),quote.replace('"Example substance"','Example substance'),quote.split('\n').reverse().join('\n')])assert.throws(()=>validateIntricDraft(draft(invalid),patient),/Invalid evidence/);
 const wrong=draft();wrong.facts[0].evidence[0].sourceId='another-patient';assert.throws(()=>validateIntricDraft(wrong,patient),/Invalid evidence/);
 assert.throws(()=>validateIntricDraft(draft(),{...patient,records:[{...med,sourceTable:undefined}]}),/Invalid evidence/);
});
test('already exact evidence remains unchanged and empty questions preserve gap questions',()=>{
 const input=draft('vaikuttava_aine: "Example substance"');const result=validateIntricDraft(input,patient);
 assert.equal(result.restoredSourceExcerpts,0);assert.deepEqual(result.content,input);assert.equal(result.content.missing.length,1);
});
