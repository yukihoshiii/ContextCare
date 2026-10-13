import { createReadStream } from 'node:fs';
import { mkdir, stat, rename, chmod, unlink } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { resolve, join, dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { mapStructuredVeil, type VeilTables } from '../src/lib/veil-structured';
async function readRows(path:string){const info=await stat(path);if(!info.isFile()||info.size>256*1024*1024)throw new Error('Invalid source file');const rows:unknown[]=[];const stream=createReadStream(path,{encoding:'utf8'});try{for await(const line of createInterface({input:stream,crlfDelay:Infinity})){if(!line.trim())continue;if(Buffer.byteLength(line)>2*1024*1024||rows.length>=500000)throw new Error('Source exceeds import limits');rows.push(JSON.parse(line));}}finally{stream.destroy();}return rows;}
async function main(){
 const [input,output,...extra]=process.argv.slice(2);if(!input||!output||extra.length)throw new Error('Usage: npm run data:import:veil -- /path/to/LUVN_synteettinenData_VEIL /path/to/new.sqlite');
 const root=resolve(input);const linkedOnly=root.split(/[\\/]/).at(-1)==='2024-2026';
 const target=resolve(output);await mkdir(dirname(target),{recursive:true,mode:0o700});
 try{await stat(target);throw new Error('Destination exists; choose a new database');}catch(e){if(!(e instanceof Error&&'code' in e&&e.code==='ENOENT'))throw e;}
 const temporary=`${target}.${process.pid}.tmp`;let db:DatabaseSync|undefined;let patientCount=0;let recordCount=0;const counts:Record<string,number>={};
 try{
  db=new DatabaseSync(temporary);await chmod(temporary,0o600);db.exec('CREATE TABLE patients(id TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE patient_directory(id TEXT PRIMARY KEY,name TEXT NOT NULL); BEGIN');
  const insert=db.prepare('INSERT INTO patients VALUES (?,?)');const directoryInsert=db.prepare('INSERT INTO patient_directory VALUES (?,?)');
  const clinicalNames=['asiakas','kontakti','ajanvaraus','diagnoosi','toimenpide','laakitys','laakitys_kontakti','laboratorio_kontakti','vastausarkistohistoria_view'];
  const socialNames=['asiakas','kontakti','paatos','selvitys','vireilletulo','palvelu','asumisjakso','kotihoito_suunniteltu_palvelu'];
  for(const cohort of (linkedOnly?['2024-2026']:['2024-2026','2025']) as ('2024-2026'|'2025')[]){
   for(const domain of (cohort==='2024-2026'?['linked']:['clinical','social']) as ('linked'|'clinical'|'social')[]){
    const base=linkedOnly?root:join(root,cohort);const tables:VeilTables={};
    const specifications=[...(domain!=='social'?clinicalNames.map(n=>`clinical/${n}`):[]),...(domain!=='clinical'?socialNames.map(n=>`social/${n}`):[])];
    for(const name of specifications)tables[name]=await readRows(join(base,name.replace('/','/tables/')+'.jsonl'));
    for(const d of (domain==='linked'?['clinical','social']:[domain]))tables[`${d}/text`]=await readRows(join(base,d,'text',`${d}-notes.jsonl`));
    const patients=mapStructuredVeil(tables,cohort,domain);
    for(const p of patients){insert.run(p.id,JSON.stringify(p));directoryInsert.run(p.id,p.name);patientCount++;recordCount+=p.records.length;}
    counts[`${cohort}:${domain}`]=patients.length;
    console.log(JSON.stringify({cohort,domain,patients:patients.length,records:patients.reduce((n,p)=>n+p.records.length,0)}));
   }
  }
  db.prepare('INSERT INTO metadata VALUES (?,?)').run('origin','organizer');db.prepare('INSERT INTO metadata VALUES (?,?)').run('populationCounts',JSON.stringify(counts));db.exec('COMMIT');db.close();db=undefined;await rename(temporary,target);
 }catch(e){db?.close();await unlink(temporary).catch(()=>{});throw e;}
 console.log(JSON.stringify({imported:patientCount,records:recordCount,populations:counts,origin:'organizer',externalTransmission:false}));
}
main().catch(()=>{console.error('Import failed. Check source schemas, unique identifiers, join ownership, dates and destination. Patient content is omitted.');process.exitCode=1;});
