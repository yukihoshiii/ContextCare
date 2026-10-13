import { z } from 'zod';
import { mapVeilPatients, customerSchema, contactSchema, decisionSchema, uniqueIndex } from './veil-import';
import { patientSchema, type PatientRecord, type Patient } from './schema';
type Row = Record<string, unknown>;
export type VeilTables = Record<string, unknown[]>;
const sourceId = (value:unknown) => z.union([z.string().min(1).max(80),z.number().int()]).parse(value).toString();
const day = (value:unknown) => z.iso.date().parse(z.string().parse(value).slice(0,10));
const rows = (tables:VeilTables,name:string):Row[] => (tables[name] || []).map(r=>z.record(z.string(),z.unknown()).parse(r));
// Render structured fields explicitly; these are field values, not a clinician's prose.
export function structuredText(table:string,row:Row,fields:string[],notice=''):string {
 return `Structured source: ${table}${notice ? `\n${notice}` : ''}\n` + fields.filter(k=>k in row).map(k=>`${k}: ${JSON.stringify(row[k])}`).join('\n');
}
export function mapStructuredVeil(tables:VeilTables,cohort:'2024-2026'|'2025',domain:'linked'|'clinical'|'social'):Patient[]{
 if(cohort==='2025'&&domain==='linked')throw new Error('The 2025 domains are independent');
 const useClinical=domain!=='social';const useSocial=domain!=='clinical';
 const customers=uniqueIndex(rows(tables,useClinical?'clinical/asiakas':'social/asiakas').map(r=>customerSchema.parse(r)),r=>r.asiakas_id);
 if(domain==='linked'){
  const socialCustomers=uniqueIndex(rows(tables,'social/asiakas').map(r=>customerSchema.parse(r)),r=>r.asiakas_id);
  if(socialCustomers.size!==customers.size||[...customers].some(([k,v])=>socialCustomers.get(k)?.syntymapaiva!==v.syntymapaiva))throw new Error('Linked populations mismatch');
 }
 const contacts=uniqueIndex(rows(tables,'clinical/kontakti').map(r=>contactSchema.parse(r)),r=>r.kontakti_id);
 const decisions=uniqueIndex(rows(tables,'social/paatos').map(r=>decisionSchema.parse(r)),r=>r.paatos_id);
 const records=new Map<string,PatientRecord[]>();
 const namespace=`veil:${cohort}:${domain}:`;
 const seen=new Set<string>();
 const add=(subject:string,table:string,key:unknown,date:unknown,type:PatientRecord['type'],title:string,row:Row,fields:string[],notice='',contactId?:string)=>{
  if(!customers.has(subject))throw new Error('Unknown structured subject');
  const id=`${table.replaceAll('/','-')}:${sourceId(key)}`;
  if(seen.has(id))throw new Error('Duplicate structured source');seen.add(id);
  const record:PatientRecord={id,date:day(date),type,title,author:'Structured source fields',text:structuredText(table,row,fields,notice),sourceTable:table,sourceKey:sourceId(key),...(contactId?{contactId}: {})};
  records.set(subject,[...(records.get(subject)||[]),record]);
 };
 const clinicalOwner=(r:Row)=>{const c=contacts.get(sourceId(r.kontakti_id));if(!c||(r.asiakas_id!=null&&sourceId(r.asiakas_id)!==c.asiakas_id))throw new Error('Clinical structured join mismatch');return c;};
 const baseClinical=useClinical?rows(tables,'clinical/text'):[];const baseSocial=useSocial?rows(tables,'social/text'):[];
 // Reuse strict text-source ownership and date validation. Text mapping remains separate from field rendering.
 if(baseClinical.length||baseSocial.length){
  const mapped=mapVeilPatients({clinical:baseClinical,social:baseSocial,customers:[...customers.values()],contacts:[...contacts.values()],decisions:[...decisions.values()]});
  for(const p of mapped){const subject=p.id.slice('veil:2024-2026:'.length);records.set(subject,p.records);for(const r of p.records)seen.add(r.id);}
 }
 if(useClinical){
  for(const r of rows(tables,'clinical/kontakti')){const c=contactSchema.parse(r);add(c.asiakas_id,'clinical/kontakti',c.kontakti_id,c.tapahtuma_pvm,'visit','Health-centre contact',r,['tapahtuma_aikaleima','kesto_minuutit_kpl','yhteystapa_koodi_hilmo','erikoisala_kansallinen_id','hoidon_kiireellisyys_selite_hilmo','palvelumuoto_id'],'A recorded contact does not establish the outcome of care.',c.kontakti_id);}
  for(const r of rows(tables,'clinical/ajanvaraus')){const c=clinicalOwner(r);add(c.asiakas_id,'clinical/ajanvaraus',r.ajanvaraus_id,r.ajanvaraus_pvm,'visit','Appointment record',r,['ajanvaraus_pvm','ajanvaraus_tila','erikoisala_kansallinen_id'],'Appointment status is a source value; booking does not establish attendance.',c.kontakti_id);}
  for(const r of rows(tables,'clinical/diagnoosi')){const c=clinicalOwner(r);add(c.asiakas_id,'clinical/diagnoosi',r.diagnoosi_id,r.diagnoosi_aikaleima,'visit','Recorded diagnosis code',r,['icd10_id','icd10_koodi_lahdejarjestelma','diagnoosi_aikaleima','diagnoosi_ensisijaisuus','onko_pitkaaikaisdiagnoosi'],'Source-coded diagnosis, not a new diagnosis by this application.',c.kontakti_id);}
  for(const r of rows(tables,'clinical/toimenpide')){const c=clinicalOwner(r);add(c.asiakas_id,'clinical/toimenpide',r.toimenpide_id,r.toimenpide_aikaleima,'visit','Recorded procedure',r,['toimenpide_aikaleima','toimenpidekoodi_kansallinen','toimenpidekoodi_selite_kansallinen','toimenpide_lkm'],'',c.kontakti_id);}
  const medicationLinks=uniqueIndex(rows(tables,'clinical/laakitys_kontakti'),r=>sourceId(r.laakitys_avain));
  for(const r of rows(tables,'clinical/laakitys')){const link=medicationLinks.get(sourceId(r.laakitys_avain));if(!link)throw new Error('Missing medication contact link');const c=clinicalOwner({...r,kontakti_id:link.kontakti_id});add(c.asiakas_id,'clinical/laakitys',r.laakitys_avain,c.tapahtuma_pvm,'medication','Medication documentation',r,['vaikuttava_aine','atc_koodi','laakkeen_kayttotapa','on_resepti','laakitys_aloituspvm','laakitys_paattymispvm'],'Dates are documentation intervals, not verified medication start/stop or current use.',c.kontakti_id);}
  if(medicationLinks.size!==rows(tables,'clinical/laakitys').length)throw new Error('Medication link coverage mismatch');
  const labLinks=uniqueIndex(rows(tables,'clinical/laboratorio_kontakti'),r=>sourceId(r.Avain));
  for(const r of rows(tables,'clinical/vastausarkistohistoria_view')){const link=labLinks.get(sourceId(r.Avain));if(!link)throw new Error('Missing laboratory contact link');const c=clinicalOwner({...r,kontakti_id:link.kontakti_id});add(c.asiakas_id,'clinical/vastausarkistohistoria_view',r.Avain,c.tapahtuma_pvm,'measurement','Laboratory source result',r,['TapahtumatyyppiSelite','TutkimusNumerotunnusAvain','SanallinenTutkimustulos','NumeerinenTutkimustulos','ViitearvonYlitys','TulokseenLiittyvaInfokentta','PaatutkimuksenNro','PaatutkimuksenLyhenne','NaytteenottoaikaPaiva'],'Timeline date comes from the explicitly linked contact. Exact decimal strings and units are preserved; no interpretation added.',c.kontakti_id);}
  if(labLinks.size!==rows(tables,'clinical/vastausarkistohistoria_view').length)throw new Error('Laboratory link coverage mismatch');
 }
 if(useSocial){
  const services=uniqueIndex(rows(tables,'social/palvelu'),r=>sourceId(r.palvelu_id));
  const personKeys=uniqueIndex(rows(tables,'social/asiakas'), r=>sourceId(r.henkilotunnus));
  for(const r of rows(tables,'social/kotihoito_suunniteltu_palvelu')){const customer=personKeys.get(sourceId(r.henkilotunnus));if(!customer)throw new Error('Unknown home-care plan subject');add(sourceId(customer.asiakas_id),'social/kotihoito_suunniteltu_palvelu',r.kotihoito_suunniteltu_palvelu_avain,r.suunniteltu_palvelu_pvm,'social','Planned home-care service',r,['suunniteltu_palvelu_pvm','palvelun_yksikko','suunniteltu_maara','suunnitelman_aikayksikko','kotihoito_palvelu_tunnus','kotihoito_palvelu_nimi','suunnitelman_voimassaolo_alkaen_pvm','suunnitelman_voimassaolo_paattymis_pvm','suunnitelman_tila'],'Planned service, not proof of delivered care. Source person key is used only for the join and omitted from the displayed fields.');}
  const assessments=uniqueIndex(rows(tables,'social/selvitys'),r=>sourceId(r.selvitys_id));
  const checkSocialLinks=(r:Row)=>{for(const [field,index] of [['paatos_id',decisions],['palvelu_id',services],['selvitys_id',assessments]] as const){if(r[field]==null)continue;const linked=index.get(sourceId(r[field]));if(!linked||sourceId(linked.asiakas_id)!==sourceId(r.asiakas_id))throw new Error('Social structured join mismatch');}};
  for(const [table,key,date,title,fields] of [
   ['paatos','paatos_id','paatos_pvm','Service decision record',['paatos_pvm','paatos_alku_pvm','paatos_loppu_pvm','onko_toistaiseksi_voimassa','palveluluokitus_nimi','palvelutehtava_nimi','ratkaisu_laji']],
   ['selvitys','selvitys_id','selvitys_alku_pvm','Social assessment record',['selvitys_alku_pvm','selvitys_loppu_pvm','selvitys_nimi','palveluprosessi_nimi','palvelutehtava_nimi','onko_erityistuen_tarve','onko_selvitys_pta']],
   ['vireilletulo','vireilletulo_id','vireilletulo_pvm','Social referral record',['vireilletulo_pvm','vireilletulo_kasittely_alku_pvm','vireilletulo_nimi','vireilletulo_tyyppi_nimi','palvelutehtava_nimi','onko_kiireellinen','onko_keskeytyneena','keskeytyksen_syy']],
   ['palvelu','palvelu_id','alku_pvm','Social service record',['palveluluokitus_nimi','palvelutehtava_nimi','alku_pvm','loppu_pvm','onko_keskeytetty','keskeytyksen_syy']],
   ['asumisjakso','asumisjakso_id','alkaen_pvm','Housing service period',['alkaen_pvm','saakka_pvm','palveluluokitus_nimi']],
   ['kontakti','kontakti_id','tapahtuma_alku_aikaleima','Social-care contact',['tapahtuma_alku_aikaleima','tapahtuma_loppu_aikaleima','kesto_minuutit_kpl','yhteystapa_id','palvelutehtava_nimi']],
  ] as [string,string,string,string,string[]][]){for(const r of rows(tables,`social/${table}`)){checkSocialLinks(r);add(sourceId(r.asiakas_id),`social/${table}`,r[key],r[date],'social',title,r,fields,'Source values only; missing end dates and pending assessments are not completed outcomes.');}}
 }
 return [...customers].sort(([a],[b])=>a.localeCompare(b)).map(([subject,c],index)=>{
  const rs=records.get(subject)||[];const lastDate=rs.map(r=>r.date).sort().at(-1)||`${cohort==='2025'?'2025':'2026'}-12-31`;const age=Number(lastDate.slice(0,4))-Number(c.syntymapaiva.slice(0,4))-(lastDate.slice(5)<c.syntymapaiva.slice(5)?1:0);
  return patientSchema.parse({id:namespace+subject,name:`Synthetic patient ${index+1} · ${cohort} ${domain}`,age:age>=0&&age<=120?age:null,ageAsOfDate:lastDate,initials:'SY',visitReason:'',appointment:'Visit context not supplied',cohort,datasetDomain:domain,records:rs.map(r=>({...r,id:`${cohort}:${domain}:${r.id}`})).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id))});
 });
}
