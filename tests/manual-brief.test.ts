import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { patients } from '../src/lib/fixtures';
import { verifyManualBrief } from '../src/lib/manual-brief';
const content = JSON.parse(readFileSync('docs/intric/trial-response.json','utf8'));
const input = {patientId:'P001',role:'doctor',visitReason:'Persistent dizziness',content};
test('real synthetic Intric trial imports with explicit manual provenance', () => { const result=verifyManualBrief(input,patients[0]);assert.equal(result.mode,'manual');assert.equal(result.facts.length,3); });
test('manual output cannot be applied to another patient', () => { assert.throws(()=>verifyManualBrief({...input,patientId:'P002'},patients[1]));assert.throws(()=>verifyManualBrief(input,patients[1])); });
test('manual output cannot smuggle mode or invalid quotes', () => { assert.throws(()=>verifyManualBrief({...input,mode:'live'},patients[0]));const copy=structuredClone(input);copy.content.facts[0].evidence[0].quote='Fabricated quote';assert.throws(()=>verifyManualBrief(copy,patients[0])); });
test('real nurse response with concatenated quotation is rejected; corrected response passes', () => {
  const bad=JSON.parse(readFileSync('docs/intric/nurse-first-response.json','utf8'));
  const corrected=JSON.parse(readFileSync('docs/intric/nurse-revised-response.json','utf8'));
  const context={patientId:'P002',role:'nurse',visitReason:'Reduced mobility after discharge'};
  assert.throws(()=>verifyManualBrief({...context,content:bad},patients[1]));
  assert.equal(verifyManualBrief({...context,content:corrected},patients[1]).facts.length,4);
});
