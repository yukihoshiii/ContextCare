import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatasetValidator } from '../src/lib/import-validation';
import { assertExternalTransmissionAllowed } from '../src/lib/data-policy';
import { patients } from '../src/lib/fixtures';
test('organizer and unknown data cannot be sent to external AI', () => {
  for (const origin of ['organizer', undefined, '', 'unverified']) assert.throws(() => assertExternalTransmissionAllowed(origin));
  assert.doesNotThrow(() => assertExternalTransmissionAllowed('self-authored'));
});
test('valid dataset counts patients and records', () => {
  const validator = new DatasetValidator();
  patients.forEach((p,i) => validator.validate(p,i+1));
  assert.equal(validator.patients, 3); assert.equal(validator.records, 11);
});
test('duplicate patients and source IDs across patients are rejected', () => {
  const validator = new DatasetValidator(); validator.validate(patients[0],1);
  assert.throws(() => validator.validate(patients[0],2), /Duplicate patient/);
  const other = structuredClone(patients[1]); other.records[0].id=patients[0].records[0].id;
  assert.throws(() => validator.validate(other,2), /Duplicate record/);
});
test('schema errors do not disclose raw data', () => {
  const validator = new DatasetValidator();
  assert.throws(() => validator.validate({ secret: 'CONFIDENTIAL_CONTENT' },1), error => error instanceof Error && !error.message.includes('CONFIDENTIAL_CONTENT'));
});
