import { z } from 'zod';
import { patientSchema, type Patient, type PatientRecord } from './schema';
const id = z.string().min(1).max(60);
export const clinicalNoteSchema = z.object({subject_id:id,visit_id:id,visit_date:z.iso.date(),clinician_role:z.string().max(100),note_text:z.string().min(1).max(10000)});
export const socialNoteSchema = z.object({subject_id:id,decision_id:id,decision_date:z.iso.date(),service:z.string().max(150),decision_text:z.string().min(1).max(10000),plan_date:z.iso.date().nullable(),plan_text:z.string().min(1).max(10000).nullable()});
export const customerSchema = z.object({asiakas_id:id,syntymapaiva:z.iso.date()});
export const contactSchema = z.object({kontakti_id:id,asiakas_id:id,tapahtuma_pvm:z.iso.date()});
export const decisionSchema = z.object({paatos_id:id,asiakas_id:id,paatos_pvm:z.iso.date()});
export function uniqueIndex<T>(rows:T[], key:(r:T)=>string):Map<string,T> {
 const result=new Map<string,T>();
 for(const row of rows) {const k=key(row); if(result.has(k)) throw new Error('Duplicate source identifier'); result.set(k,row);}
 return result;
}
export function mapVeilPatients(input:{clinical:unknown[];social:unknown[];customers:unknown[];contacts:unknown[];decisions:unknown[]}):Patient[] {
 const customers=uniqueIndex(input.customers.map(r=>customerSchema.parse(r)),r=>r.asiakas_id);
 const contacts=uniqueIndex(input.contacts.map(r=>contactSchema.parse(r)),r=>r.kontakti_id);
 const decisions=uniqueIndex(input.decisions.map(r=>decisionSchema.parse(r)),r=>r.paatos_id);
 const clinical=input.clinical.map(r=>clinicalNoteSchema.parse(r));
 const social=input.social.map(r=>socialNoteSchema.parse(r));
 uniqueIndex(clinical,r=>r.visit_id); uniqueIndex(social,r=>r.decision_id);
 const records=new Map<string,PatientRecord[]>();
 const add=(subject:string,record:PatientRecord)=>{if(!customers.has(subject))throw new Error('Unknown source subject'); records.set(subject,[...(records.get(subject)||[]),record]);};
 for(const r of clinical){const contact=contacts.get(r.visit_id); if(!contact||contact.asiakas_id!==r.subject_id||contact.tapahtuma_pvm!==r.visit_date)throw new Error('Clinical join mismatch'); add(r.subject_id,{id:`clinical:${r.visit_id}`,date:r.visit_date,type:'visit',title:'Clinical note',author:r.clinician_role,text:r.note_text});}
 for(const r of social){const decision=decisions.get(r.decision_id); if(!decision||decision.asiakas_id!==r.subject_id||decision.paatos_pvm!==r.decision_date)throw new Error('Social join mismatch'); if(Boolean(r.plan_text)!==Boolean(r.plan_date))throw new Error('Incomplete plan source'); add(r.subject_id,{id:`decision:${r.decision_id}`,date:r.decision_date,type:'social',title:`Decision draft · ${r.service}`,author:'Social care · draft',text:r.decision_text}); if(r.plan_text&&r.plan_date)add(r.subject_id,{id:`plan:${r.decision_id}`,date:r.plan_date,type:'social',title:`Implementation plan draft · ${r.service}`,author:'Social care · draft',text:r.plan_text});}
 return [...records].sort(([a],[b])=>a.localeCompare(b)).map(([subject,rs],index)=>{
  const lastDate=rs.map(r=>r.date).sort().at(-1)!;
  const birth=customers.get(subject)!.syntymapaiva;
  const age=Number(lastDate.slice(0,4))-Number(birth.slice(0,4))-(lastDate.slice(5)<birth.slice(5)?1:0);
  return patientSchema.parse({id:`veil:2024-2026:${subject}`,name:`Synthetic patient ${index+1}`,age,ageAsOfDate:lastDate,initials:'SY',visitReason:'',appointment:'Visit context not supplied',records:rs.sort((a,b)=>b.date.localeCompare(a.date))});
 });
}
