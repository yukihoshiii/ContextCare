import test from 'node:test';
import assert from 'node:assert/strict';
import {assertIntricTransmissionAllowed} from '../src/lib/intric-approval';
import {assertExternalTransmissionAllowed} from '../src/lib/data-policy';
test('organizer approval applies only to delivered Veil profiles in the approved database',()=>{
 const previous=process.env.DATABASE_PATH;
 try {
  process.env.DATABASE_PATH='./data/veil-full.sqlite';
  for(const id of ['veil:2024-2026:linked:SYN-ASI-1000000001','veil:2025:clinical:SYN-ASI-00000001','veil:2025:social:SYN-ASI-2000000001'])assert.doesNotThrow(()=>assertIntricTransmissionAllowed('organizer',id));
  assert.throws(()=>assertIntricTransmissionAllowed('organizer','P001'));
  assert.throws(()=>assertIntricTransmissionAllowed(undefined,'veil:2025:clinical:SYN-ASI-00000001'));
  process.env.DATABASE_PATH='./data/other.sqlite';
  assert.throws(()=>assertIntricTransmissionAllowed('organizer','veil:2025:clinical:SYN-ASI-00000001'));
  assert.doesNotThrow(()=>assertIntricTransmissionAllowed('self-authored','P001'));
  assert.throws(()=>assertExternalTransmissionAllowed('organizer')); // Other providers stay blocked.
 }finally{if(previous===undefined)delete process.env.DATABASE_PATH;else process.env.DATABASE_PATH=previous;}
});
