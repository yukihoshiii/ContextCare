import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { patients } from '../src/lib/fixtures';
test('organizer database cannot be reclassified through an environment variable',()=>{
 const dir=mkdtempSync(join(tmpdir(),'contextcare-origin-'));const path=join(dir,'source.sqlite');
 try {
  const db=new DatabaseSync(path);db.exec('CREATE TABLE patients(id TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL)');db.prepare('INSERT INTO patients VALUES (?,?)').run(patients[0].id,JSON.stringify(patients[0]));db.prepare('INSERT INTO metadata VALUES (?,?)').run('origin','organizer');db.close();
  const script=`import {getRepository} from './src/lib/repository.ts'; import {briefProvider} from './src/lib/provider.ts'; let sent=false; globalThis.fetch=async()=>{sent=true;throw new Error('Unexpected transmission')}; const repo=await getRepository(); const patient=await repo.get('P001');let blocked=false;try{await briefProvider.generate(patient,'doctor','Review','2026-10-13')}catch(e){blocked=e.constructor.name==='RestrictedDataError'}console.log(JSON.stringify({origin:repo.origin,blocked,sent}));`;
  const result=spawnSync(process.execPath,['--conditions=react-server','--import','tsx','--input-type=module','-e',script],{env:{...process.env,PATIENT_STORE:'sqlite',DATABASE_PATH:path,DATA_ORIGIN:'self-authored',AI_GATEWAY_URL:'https://example.invalid'},encoding:'utf8'});
  assert.equal(result.status,0);assert.deepEqual(JSON.parse(result.stdout.trim()),{origin:'organizer',blocked:true,sent:false});
 }finally{rmSync(dir,{recursive:true,force:true});}
});
