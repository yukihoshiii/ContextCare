import { test } from 'node:test';
import assert from 'node:assert/strict';
import { patients } from '../src/lib/fixtures';
import { demoBrief } from '../src/lib/demo';
import { briefRequestSchema, validateEvidence, type Role } from '../src/lib/schema';
test('every role and patient has valid source quotes', () => {
  for (const patient of patients) for (const role of ['doctor','nurse','social-worker'] as Role[]) {
    assert.doesNotThrow(() => validateEvidence(demoBrief(patient, role), patient));
  }
});
test('cross-patient citations are rejected', () => {
  assert.throws(() => validateEvidence(demoBrief(patients[0], 'doctor'), patients[1]));
});
test('fabricated quotations are rejected', () => {
  const brief = demoBrief(patients[0], 'doctor');
  brief.facts[0].evidence[0].quote = 'The patient has a diagnosis not in the record.';
  assert.throws(() => validateEvidence(brief, patients[0]));
});
test('facts without evidence and invalid status are rejected', () => {
  const brief = demoBrief(patients[0], 'doctor');
  assert.throws(() => validateEvidence({ ...brief, facts: [{ ...brief.facts[0], evidence: [] }] }, patients[0]));
  assert.throws(() => validateEvidence({ ...brief, facts: [{ ...brief.facts[0], status: 'confirmed-diagnosis' }] }, patients[0]));
});
test('role perspective changes record priority', () => {
  const doctor = demoBrief(patients[0], 'doctor');
  const social = demoBrief(patients[0], 'social-worker');
  assert.notEqual(doctor.facts[0].evidence[0].sourceId, social.facts[0].evidence[0].sourceId);
  assert.equal(social.facts[0].evidence[0].sourceId, 'EK-04');
});
test('unknown role, oversized input and extra fields are rejected', () => {
  assert.equal(briefRequestSchema.safeParse({patientId:'P001',role:'admin',visitReason:'Dizziness'}).success, false);
  assert.equal(briefRequestSchema.safeParse({patientId:'P001',role:'doctor',visitReason:'a'.repeat(501)}).success, false);
  assert.equal(briefRequestSchema.safeParse({patientId:'P001',role:'doctor',visitReason:'Dizziness',records:[]}).success, false);
});

test('streaming body limit rejects oversized data before buffering everything', async () => {
  const { readLimitedBody, BodyTooLarge } = await import('../src/lib/body');
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(5000)); controller.close(); } });
  await assert.rejects(() => readLimitedBody(stream, 4096), BodyTooLarge);
});
