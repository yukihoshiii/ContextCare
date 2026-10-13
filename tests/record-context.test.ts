import test from 'node:test';
import assert from 'node:assert/strict';
import { patients } from '../src/lib/fixtures';
import { patientAtDate } from '../src/lib/record-context';
import { verifyManualBrief } from '../src/lib/manual-brief';
import { briefProvider } from '../src/lib/provider';
test('context cutoff includes its own day and excludes later records without mutating sources',()=>{const p=patients[0];const selected=patientAtDate(p,'2026-09-20');assert.equal(selected.records.length,3);assert.ok(selected.records.some(r=>r.date==='2026-09-20'));assert.equal(p.records.length,5);});
test('manual verification rejects citations dated after selected context',()=>{const p=patients[0];const future=p.records.at(-1)!;assert.throws(()=>verifyManualBrief({patientId:p.id,role:'doctor',visitReason:'Review',asOfDate:'2026-09-20',content:{facts:[{title:'Future',text:'Future',status:'documented',evidence:[{sourceId:future.id,quote:future.text}]}],missing:[]}},p),/Invalid evidence/);});
test('generation has no future excerpts and fails clearly for dates without sources',async()=>{const p=patients[0];const brief=await briefProvider.generate(p,'doctor','Review','2026-09-20');assert.equal(brief.asOfDate,'2026-09-20');assert.ok(brief.facts.every(f=>f.evidence.every(e=>patientAtDate(p,'2026-09-20').records.some(r=>r.id===e.sourceId))));await assert.rejects(()=>briefProvider.generate(p,'doctor','Review','2020-01-01'),/No records/);});
