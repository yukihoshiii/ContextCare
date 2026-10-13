import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { patients } from '../src/lib/fixtures';
const run = (path: string) => spawnSync(process.execPath, ['--import', 'tsx', 'scripts/validate-dataset.ts', path, 'self-authored'], { encoding: 'utf8' });
test('CLI validates JSONL and CSV with quotes, Unicode and line breaks', async () => {
  const dir = await mkdtemp(join(tmpdir(),'contextcare-tool-test-'));
  try {
    const jsonl = join(dir,'sample.jsonl');
    await writeFile(jsonl, patients.map(p => JSON.stringify(p)).join('\n'));
    const result = run(jsonl);
    assert.equal(result.status,0,result.stderr);
    assert.equal(JSON.parse(result.stdout).records,11);
    const patient = structuredClone(patients[0]); patient.name='Fictional "Unicode ä"\nName';
    const headers = ['id','name','age','initials','visitReason','appointment','records'];
    const quote = (value: unknown) => '"'+String(value).replaceAll('"','""')+'"';
    const csv = join(dir,'sample.csv');
    await writeFile(csv, headers.join(',')+'\n'+headers.map(key => quote(key === 'records' ? JSON.stringify(patient.records) : patient[key as keyof typeof patient])).join(','));
    const csvResult=run(csv); assert.equal(csvResult.status,0,csvResult.stderr);
    assert.equal(JSON.parse(csvResult.stdout).patients,1);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
test('CLI fails for duplicate ID and malformed CSV without leaking field values', async () => {
  const dir=await mkdtemp(join(tmpdir(),'contextcare-tool-test-'));
  try {
    const jsonl=join(dir,'duplicate.jsonl'); await writeFile(jsonl,[patients[0],patients[0]].map(p=>JSON.stringify(p)).join('\n'));
    assert.notEqual(run(jsonl).status,0);
    const csv=join(dir,'bad.csv'); await writeFile(csv,'id,name\nP001,"CONFIDENTIAL_CONTENT');
    const result=run(csv); assert.notEqual(result.status,0); assert.equal(result.stderr.includes('CONFIDENTIAL_CONTENT'),false);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
