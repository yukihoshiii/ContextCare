import test from 'node:test';
import assert from 'node:assert/strict';
import {patients} from '../src/lib/fixtures';
import {demoBrief} from '../src/lib/demo';
import {validateEvidence} from '../src/lib/schema';
import {patientAtDate} from '../src/lib/record-context';
const patient=patients[0];
const record=patient.records[2];
const question={title:'Symptom changes',question:'How has your dizziness changed?',rationale:'This visit concerns dizziness documented in the previous note.',evidence:[{sourceId:record.id,quote:record.text}]};
function output(){return {...demoBrief(patient,'doctor'),questions:[structuredClone(question)]};}
test('preparation questions preserve their exact evidence and reject fabricated/cross-patient sources',()=>{
 assert.deepEqual(validateEvidence(output(),patient).questions,[question]);
 for(const evidence of [{sourceId:patients[1].records[0].id,quote:patients[1].records[0].text},{sourceId:record.id,quote:'invented symptom'}]){
  const content=output();content.questions[0].evidence=[evidence];assert.throws(()=>validateEvidence(content,patient),/Invalid evidence/);
 }
});
test('questions require evidence and stay within the bounded output contract',()=>{
 const content=output();
 assert.throws(()=>validateEvidence({...content,questions:[{...question,evidence:[]}]},patient));
 assert.throws(()=>validateEvidence({...content,questions:Array.from({length:6},()=>question)},patient));
 assert.throws(()=>validateEvidence({...content,questions:[{...question,answer:'No symptoms'}]},patient));
});
test('future-dated question evidence is rejected against preparation-date sources',()=>{
 const filtered=patientAtDate(patient,record.date);
 const future={...record,id:'future-question-source',date:'2099-01-01',text:'Future observation'};
 const content={facts:output().facts.filter(f=>f.evidence.every(e=>filtered.records.some(r=>r.id===e.sourceId))),missing:[],questions:[{...question,evidence:[{sourceId:future.id,quote:future.text}]}]};
 assert.ok(content.facts.length);assert.throws(()=>validateEvidence(content,patientAtDate({...patient,records:[...patient.records,future]},record.date)),/Invalid evidence/);
});
