import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDiagnosisLabels,diagnosisRecordTitle,diagnosisTextParts} from '../src/lib/diagnosis-labels';
import type {PatientRecord} from '../src/lib/schema';
const note:PatientRecord={id:'authored-note',date:'2026-09-01',type:'visit',title:'Authored test',author:'Test',text:'## AIKAISEMPI HOITO\n2026-01-01: J06.9 Example recorded label.\n## DIAGNOOSI\nK59.0 Another example label (ensisijainen).'};
test('recorded names are extracted without changing original source text',()=>{
 const original=structuredClone(note);const labels=buildDiagnosisLabels([note],'2026-10-13');
 assert.equal(labels.get('J06.9'),'Example recorded label');assert.equal(labels.get('K59.0'),'Another example label');assert.deepEqual(note,original);
 const diagnosis={...note,id:'authored-code',sourceTable:'clinical/diagnoosi',title:'Recorded diagnosis code',text:'icd10_id: "K59.0"'};
 assert.equal(diagnosisRecordTitle(diagnosis,labels),'Another example label (K59.0)');assert.equal(diagnosis.text,'icd10_id: "K59.0"');
});
test('future notes and conflicting labels do not silently decode a code',()=>{
 assert.equal(buildDiagnosisLabels([note],'2026-08-31').size,0);
 const conflicting={...note,id:'conflict',text:'## DIAGNOOSI\nK59.0 Conflicting example label.'};
 assert.equal(buildDiagnosisLabels([note,conflicting],'2026-10-13').has('K59.0'),false);
});
test('only complete known codes are expanded, preserving punctuation and original code',()=>{
 const labels=buildDiagnosisLabels([note],'2026-10-13');
 assert.deepEqual(diagnosisTextParts('Diagnosis: K59.0.',labels),[{text:'Diagnosis: '},{text:'K59.0',name:'Another example label'},{text:'.'}]);
 for(const text of ['Unknown E30.03.','Longer code K59.03','Longer code K59.0.1','ATC R03AC02','source:K59.0','Another example label (K59.0)'])assert.deepEqual(diagnosisTextParts(text,labels),[{text}]);
});
test('unrelated prose is never treated as a diagnosis label',()=>{
 const unrelated={...note,text:'## SUUNNITELMA\nK59.0 Some unrelated sentence.\n## TULOSYY JA ESITIEDOT\nJ06.9 Another unrelated sentence.'};
 assert.equal(buildDiagnosisLabels([unrelated],'2026-10-13').size,0);
});
