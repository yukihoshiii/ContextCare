import type { Patient, Role } from './schema';

const glossary: [RegExp,string[]][] = [
  [/knee|polv/i,['knee','polv']], [/dizz|huima/i,['dizz','huima']],
  [/breath|respirat|cough|hengit|yskä/i,['breath','respirat','cough','hengit','yskä']],
  [/fatigue|väsym/i,['fatigue','väsym']], [/mobility|walking|liikk|kävel/i,['mobility','walking','liikk','kävel']],
  [/back pain|selkä/i,['back pain','selkä']], [/diabet/i,['diabet']],
];
export function selectAIContext(patient: Patient, role: Role, reason: string) {
  const terms = new Set(reason.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(t=>t.length>=4 && !['review','follow','preparation','appointment','patient','visit','care','pain'].includes(t)));
  for(const [pattern,words] of glossary)if(pattern.test(reason))for(const word of words)terms.add(word);
  const ranked = patient.records.map((record,index)=>{
    const text=`${record.title} ${record.text}`.toLocaleLowerCase();
    const matches=[...terms].filter(t=>text.includes(t)).length;
    const prose = !record.sourceTable;
    const priority = prose ? (role==='social-worker' && record.type==='social' ? 12 : 10) : record.type==='medication' ? (role==='social-worker'?2:6) : record.type==='measurement' ? (role==='social-worker'?1:5) : record.type==='social' ? (role==='social-worker'?7:3) : 4;
    const administrative = /\/(kontakti|ajanvaraus)$/.test(record.sourceTable || '');
    return {record,index,score:matches*30+priority-(administrative?4:0)};
  }).sort((a,b)=>b.score-a.score || b.record.date.localeCompare(a.record.date) || a.index-b.index);
  let bytes=0;
  const selected: Patient['records']=[];
  for(const {record} of ranked){
    const size=Buffer.byteLength(JSON.stringify({id:record.id,date:record.date,type:record.type,title:record.title,text:record.text}),'utf8')+1;
    if(selected.length<100 && bytes+size<=90000){selected.push(record);bytes+=size;}
  }
  return {patient:{...patient,records:selected},availableCount:patient.records.length,selectedCount:selected.length};
}

export function modelSourcePatient(patient: Patient): Patient {
  return {...patient,records:patient.records.map(record=>record.sourceTable === 'clinical/laakitys' ? {...record,text:record.text.split('\n').filter(line=>!/^laakitys_(aloituspvm|paattymis|paattumis)/.test(line)).join('\n')} : record)};
}
