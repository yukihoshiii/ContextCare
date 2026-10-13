import test from 'node:test';
import assert from 'node:assert/strict';
import { mapVeilPatients } from '../src/lib/veil-import';
import { demoBrief } from '../src/lib/demo';
import { validateEvidence } from '../src/lib/schema';
const input=()=>({customers:[{asiakas_id:'a',syntymapaiva:'1960-06-20'}],contacts:[{kontakti_id:'v',asiakas_id:'a',tapahtuma_pvm:'2026-06-19'}],decisions:[{paatos_id:'d',asiakas_id:'a',paatos_pvm:'2026-06-18'}],clinical:[{subject_id:'a',visit_id:'v',visit_date:'2026-06-19',clinician_role:'nurse',note_text:'Source text '.repeat(200)}],social:[{subject_id:'a',decision_id:'d',decision_date:'2026-06-18',service:'Home care',decision_text:'Decision draft',plan_date:'2026-06-21',plan_text:'Plan draft'}]});
test('linked import keeps draft sources separate and computes age at source date',()=>{const p=mapVeilPatients(input())[0];assert.equal(p.records.length,3);assert.equal(p.age,66);assert.equal(p.ageAsOfDate,'2026-06-21');assert.equal(p.visitReason,'');assert.equal(p.records.filter(r=>r.title.includes('draft')).length,2);assert.equal(p.records.find(r=>r.type==='visit')!.text,input().clinical[0].note_text);validateEvidence(demoBrief(p,'doctor'),p);assert.deepEqual(demoBrief(p,'social-worker').missing,[]);});
test('rejects cross-patient and mismatched-date clinical joins',()=>{const a=input();a.contacts[0].asiakas_id='b';assert.throws(()=>mapVeilPatients(a),/mismatch/);const b=input();b.contacts[0].tapahtuma_pvm='2026-06-18';assert.throws(()=>mapVeilPatients(b),/mismatch/);});
test('rejects duplicate sources and incomplete social plan',()=>{const a=input();a.clinical.push(a.clinical[0]);assert.throws(()=>mapVeilPatients(a),/Duplicate/);const b=input();b.social[0].plan_date=null as unknown as string;assert.throws(()=>mapVeilPatients(b),/Incomplete/);});

test('dedicated Intric trial preserves exact source quotations',async()=>{
 const {readFile}=await import('node:fs/promises');const {patients}=await import('../src/lib/fixtures');
 const result=validateEvidence(JSON.parse(await readFile(new URL('../docs/intric/dedicated-trial-response.json',import.meta.url),'utf8')),patients[0]);
 assert.equal(result.facts.length,3);assert.equal(result.missing.length,3);
});
