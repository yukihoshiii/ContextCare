import test from 'node:test';import assert from 'node:assert/strict';
import {selectAIContext} from '../src/lib/ai-context';import {patients} from '../src/lib/fixtures';
test('long histories keep older complaint-matched Finnish note within a bounded context',()=>{
 const p=structuredClone(patients[0]);p.records=Array.from({length:150},(_,i)=>({...p.records[0],id:`noise-${i}`,date:'2026-09-01',text:'Administrative record. '.repeat(200),sourceTable:'clinical/kontakti'}));
 p.records.push({...patients[0].records[0],id:'knee-care',date:'2024-01-01',text:'Polvikipu. Aikaisempi tutkimus ja hoito.'});
 const result=selectAIContext(p,'doctor','Knee pain follow-up');
 assert.equal(result.availableCount,151);assert.ok(result.selectedCount<151);assert.ok(result.patient.records.some(r=>r.id==='knee-care'));assert.ok(Buffer.byteLength(JSON.stringify(result.patient.records))<95000);assert.equal(p.records.length,151);
});
test('small contexts keep all source records without mixing patient histories',()=>{
 const result=selectAIContext(patients[1],'nurse','Mobility review');assert.equal(result.selectedCount,3);assert.ok(result.patient.records.every(r=>r.id.startsWith('ML-')));
});

test('medication documentation intervals stay in source but are omitted from model input',async()=>{
 const {modelSourcePatient}=await import('../src/lib/ai-context');
 const p=structuredClone(patients[0]);p.records=[{...p.records[0],type:'medication',sourceTable:'clinical/laakitys',text:'vaikuttava_aine: "metformiini"\nlaakitys_aloituspvm: "2026-01-01"\nlaakitys_paattymis_pvm: "2026-11-28"'}];
 const input=modelSourcePatient(p);assert.ok(!input.records[0].text.includes('2026-11-28'));assert.ok(p.records[0].text.includes('2026-11-28'));assert.ok(p.records[0].text.includes(input.records[0].text));
});
