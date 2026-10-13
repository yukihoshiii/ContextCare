import type { PatientRecord, BriefContent } from './schema';
import { noteSections, completeExcerpt } from './note-sections';
const labels: Record<string,string> = {
 vaikuttava_aine:'Active substance',atc_koodi:'ATC code',laakkeen_kayttotapa:'Recorded use',on_resepti:'Prescription',laakitys_aloituspvm:'Documentation interval starts',laakitys_paattymispvm:'Documentation interval ends',
 PaatutkimuksenLyhenne:'Test',PaatutkimuksenNro:'Test code',TutkimusNumerotunnusAvain:'Test identifier',NumeerinenTutkimustulos:'Result',SanallinenTutkimustulos:'Text result',TulokseenLiittyvaInfokentta:'Source information / unit',ViitearvonYlitys:'Source reference-range flag',
 icd10_id:'Diagnosis code',icd10_koodi_lahdejarjestelma:'Source diagnosis code',onko_pitkaaikaisdiagnoosi:'Long-term diagnosis flag',diagnoosi_ensisijaisuus:'Source priority',
 toimenpidekoodi_selite_kansallinen:'Procedure',toimenpidekoodi_kansallinen:'Procedure code',toimenpide_lkm:'Count',
 ajanvaraus_tila:'Appointment status',ajanvaraus_pvm:'Appointment record date',yhteystapa_koodi_hilmo:'Contact method code',yhteystapa_id:'Contact method code',kesto_minuutit_kpl:'Duration in minutes',hoidon_kiireellisyys_selite_hilmo:'Recorded urgency',
 palveluluokitus_nimi:'Service',palvelutehtava_nimi:'Service area',ratkaisu_laji:'Decision outcome',paatos_pvm:'Decision date',paatos_alku_pvm:'Decision validity starts',paatos_loppu_pvm:'Decision validity ends',onko_toistaiseksi_voimassa:'Open-ended validity',
 onko_selvitys_pta:'Service-needs assessment flag',selvitys_nimi:'Assessment',selvitys_alku_pvm:'Assessment started',selvitys_loppu_pvm:'Recorded assessment end date',onko_erityistuen_tarve:'Special support flag',palveluprosessi_nimi:'Service process',
 vireilletulo_nimi:'Referral',vireilletulo_tyyppi_nimi:'Referral type',vireilletulo_pvm:'Referral date',vireilletulo_kasittely_alku_pvm:'Processing started',onko_kiireellinen:'Urgent referral flag',
 alku_pvm:'Period starts',loppu_pvm:'Period ends',alkaen_pvm:'Period starts',saakka_pvm:'Period ends',onko_keskeytetty:'Service interrupted',onko_keskeytyneena:'Process interrupted',keskeytyksen_syy:'Recorded interruption reason',
 kotihoito_palvelu_nimi:'Planned service',suunniteltu_maara:'Planned amount',palvelun_yksikko:'Unit',suunnitelman_aikayksikko:'Time unit',suunnitelman_tila:'Plan status',suunniteltu_palvelu_pvm:'Planned service date',
 tapahtuma_aikaleima:'Contact time',tapahtuma_alku_aikaleima:'Contact started',tapahtuma_loppu_aikaleima:'Contact ended',
};
const preferred:Record<string,string[]>={
 'clinical/laakitys':['vaikuttava_aine','laakkeen_kayttotapa','on_resepti','laakitys_aloituspvm','laakitys_paattymispvm'],
 'clinical/diagnoosi':['icd10_id','onko_pitkaaikaisdiagnoosi'],
 'clinical/vastausarkistohistoria_view':['PaatutkimuksenLyhenne','NumeerinenTutkimustulos','TulokseenLiittyvaInfokentta','SanallinenTutkimustulos','ViitearvonYlitys'],
};
export function displaySourceValue(value:unknown):string {
 if(value===null)return 'Not recorded';if(value===true)return 'Yes';if(value===false)return 'No';
 if(value==='TARVITTAESSA')return 'As needed';
 if(value==='SÄÄNNÖLLINEN')return 'Regular use recorded';
 if(typeof value==='string')return value;
 return typeof value==='number'?String(value):JSON.stringify(value);
}

export function structuredSourceFields(record:PatientRecord) {
 const fields:{label:string;value:string;quote:string}[]=[];
 for(const line of record.text.split('\n')){const match=line.match(/^([^:]+): (.+)$/);if(!match||!labels[match[1]])continue;try{fields.push({label:labels[match[1]],value:displaySourceValue(JSON.parse(match[2])),quote:line});}catch{}}
 return fields;
}
export function summarizeSource(record:PatientRecord):BriefContent['facts'][number] {
 if(!record.sourceTable){
  const sections=noteSections(record.text);
  const wanted=[['TULOSYY JA ESITIEDOT','Reason for contact'],['NYKYTILA','Recorded findings'],['RISKITIEDOT','Reported risks'],['SUUNNITELMA','Recorded plan']];
  const lines:string[]=[];const evidence:BriefContent['facts'][number]['evidence']=[];
  for(const [heading,label] of wanted){const section=sections.find(s=>s.heading===heading);if(!section)continue;const budget=Math.min(190,590-lines.join('\n').length-label.length-4);const excerpt=completeExcerpt(section.text,budget);if(!excerpt)continue;lines.push(`${label}: ${excerpt}`);evidence.push({sourceId:record.id,quote:excerpt});}
  if(evidence.length)return {title:record.title,text:lines.join('\n'),status:'documented',evidence};
  const plain=sections.length?sections[0].text:record.text;
  const excerpt=completeExcerpt(plain,500);
  return excerpt?{title:record.title,text:excerpt,status:'documented',evidence:[{sourceId:record.id,quote:excerpt}]}:{title:record.title,text:'Open the source for the full note; a complete short excerpt is unavailable.',status:'needs-review',evidence:[{sourceId:record.id,quote:plain.slice(0,500)}]};
 }
 const fields=new Map<string,{value:unknown;quote:string}>();
 for(const line of record.text.split('\n')){const match=line.match(/^([^:]+): (.+)$/);if(!match||!labels[match[1]])continue;try{fields.set(match[1],{value:JSON.parse(match[2]),quote:line});}catch{/* Not a rendered JSON field. */}}
 const keys=(preferred[record.sourceTable]||[...fields.keys()]).filter(k=>fields.has(k)).slice(0,5);
 const medication=record.sourceTable==='clinical/laakitys';
 const qualifier=record.sourceTable==='social/selvitys'?'Assessment documentation; recorded dates do not confirm completion. ':medication?'Documented medication; current use is not confirmed. ':record.sourceTable==='social/kotihoito_suunniteltu_palvelu'?'Planned service; delivery is not confirmed. ':'';
 let text=qualifier.trim();const evidence:BriefContent['facts'][number]['evidence']=[];
 for(const key of keys){const field=fields.get(key)!;const sentence=`${labels[key]}: ${displaySourceValue(field.value)}.`;if(text.length+sentence.length+1>600||field.quote.length>1000)continue;text+=`${text ? '\n' : ''}${sentence}`;evidence.push({sourceId:record.id,quote:field.quote});}
 if(!evidence.length)return {title:record.title,text:'Open the source to review this structured record.',status:'needs-review',evidence:[{sourceId:record.id,quote:record.text.slice(0,500)}]};
 return {title:record.title,text:text.trim(),status:'documented',evidence};
}
