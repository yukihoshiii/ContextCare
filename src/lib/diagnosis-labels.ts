import type {PatientRecord} from './schema';
import {noteSections} from './note-sections';

// Patient-local recorded labels, not a universal ICD dictionary or a new diagnosis.
export function buildDiagnosisLabels(records:PatientRecord[],cutoff:string):Map<string,string>{
 const candidates=new Map<string,Set<string>>();
 for(const record of records){
  if(record.date>cutoff||record.sourceTable)continue;
  for(const section of noteSections(record.text)){
   if(!/^(DIAGNOOSIT?|AIKAISEMPI HOITO)$/i.test(section.heading))continue;
   for(const line of section.text.split('\n')){
    const match=line.trim().match(/^(?:\d{4}-\d{2}-\d{2}:\s*)?([A-Z]\d{2}(?:\.[A-Z0-9]{1,4})?)[*†+]?\s+(.+)$/);
    if(!match)continue;
    const name=match[2].split(/\s+Käyntiin liitetty lääketietue:/)[0].replace(/\s*\((?:ensisijainen|toissijainen|päädiagnoosi|sivudiagnoosi)\)\.?$/i,'').replace(/\.$/,'').trim();
    if(!name||name.length>200)continue;
    const names=candidates.get(match[1])||new Set<string>();names.add(name);candidates.set(match[1],names);
   }
  }
 }
 return new Map([...candidates].filter(([,names])=>names.size===1).map(([code,names])=>[code,[...names][0]]));
}
export function diagnosisRecordTitle(record:PatientRecord,labels:Map<string,string>):string{
 if(record.sourceTable!=='clinical/diagnoosi')return record.title;
 const match=record.text.match(/^icd10_id: (.+)$/m);
 if(!match)return record.title;
 try{const code=JSON.parse(match[1]);const name=typeof code==='string'?labels.get(code):undefined;return name?`${name} (${code})`:record.title;}catch{return record.title;}
}
export function diagnosisTextParts(text:string,labels:Map<string,string>):{text:string;name?:string}[]{
 const result:{text:string;name?:string}[]=[];let cursor=0;
 for(const match of text.matchAll(/\b[A-Z]\d{2}(?:\.[A-Z0-9]{1,4})?\b/g)){
  // Do not match part of a longer/invalid code or an identifier.
  if(/[\w.:-]/.test(text[match.index!-1]||'')||(/[\w:-]/.test(text[match.index!+match[0].length]||'')||(text[match.index!+match[0].length]==='.'&&/[A-Za-z0-9]/.test(text[match.index!+match[0].length+1]||''))))continue;
  const name=labels.get(match[0]);
  if(!name||text.toLocaleLowerCase().includes(name.toLocaleLowerCase()))continue;
  result.push({text:text.slice(cursor,match.index)},{text:match[0],name});cursor=match.index!+match[0].length;
 }
 result.push({text:text.slice(cursor)});return result;
}
