import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSource } from '../src/lib/source-summary';
import { validateEvidence } from '../src/lib/schema';
import { patients } from '../src/lib/fixtures';
import { structuredText } from '../src/lib/veil-structured';
test('medication preview has readable labels and exact field evidence without changing source',()=>{
 const text=structuredText('clinical/laakitys',{vaikuttava_aine:'example substance',laakkeen_kayttotapa:'TARVITTAESSA',on_resepti:true,laakitys_aloituspvm:'2026-04-07',laakitys_paattymispvm:'2026-12-06'},['vaikuttava_aine','laakkeen_kayttotapa','on_resepti','laakitys_aloituspvm','laakitys_paattymispvm']);
 const record={id:'m',date:'2026-04-07',type:'medication' as const,title:'Medication documentation',author:'Source',sourceTable:'clinical/laakitys',text};
 const fact=summarizeSource(record);
 assert.match(fact.text,/Active substance: example substance/);assert.match(fact.text,/As needed/);assert.match(fact.text,/Prescription: Yes/);assert.match(fact.text,/current use is not confirmed/);assert.doesNotMatch(fact.text,/vaikuttava_aine|Structured source|on_resepti/);assert.equal(record.text,text);
 validateEvidence({facts:[fact],missing:[]},{...patients[0],records:[record]});
});
test('laboratory exact decimal and missing values are preserved in readable output',()=>{
 const record={id:'l',date:'2026-04-07',type:'measurement' as const,title:'Laboratory result',author:'Source',sourceTable:'clinical/vastausarkistohistoria_view',text:structuredText('clinical/vastausarkistohistoria_view',{PaatutkimuksenLyhenne:'Example',NumeerinenTutkimustulos:'1.2300',SanallinenTutkimustulos:null},['PaatutkimuksenLyhenne','NumeerinenTutkimustulos','SanallinenTutkimustulos'])};
 const fact=summarizeSource(record);assert.match(fact.text,/Result: 1.2300/);assert.match(fact.text,/Not recorded/);validateEvidence({facts:[fact],missing:[]},{...patients[0],records:[record]});
});

test('clinical note preview extracts complete relevant sentences and preserves exact source evidence',()=>{
 const text='## KÄYNNIN TIEDOT\n2026-09-09.\n\n## TULOSYY JA ESITIEDOT\nPatient reports a cough for three days. Drinking is possible.\n\n## AIKAISEMPI HOITO\nA long unrelated historical list.\n\n## NYKYTILA\nRemote visit. No physical examination performed.\n\n## RISKITIEDOT\nPatient reports no known medication allergies.\n\n## SUUNNITELMA\nFollow-up was documented.\n\n## DIAGNOOSI\nJ06.9 Source code.';
 const record={id:'note',date:'2026-09-09',type:'visit' as const,title:'Clinical note',author:'Nurse',text};
 const fact=summarizeSource(record);assert.doesNotMatch(fact.text,/##|unrelated historical list|J06/);assert.match(fact.text,/Reason for contact: Patient reports/);assert.match(fact.text,/Recorded plan: Follow-up was documented\./);assert.equal(fact.evidence.length,4);validateEvidence({facts:[fact],missing:[]},{...patients[0],records:[record]});
});
test('long notes do not get cut in the middle of a sentence or diagnosis code',()=>{
 const record={id:'long',date:'2026-09-09',type:'visit' as const,title:'Clinical note',author:'Nurse',text:'## TULOSYY JA ESITIEDOT\nComplete short sentence. '+ 'Long text without punctuation '.repeat(30)};
 const fact=summarizeSource(record);assert.equal(fact.text,'Reason for contact: Complete short sentence.');assert.equal(fact.evidence[0].quote,'Complete short sentence.');
});

test('social assessment has readable fields, preserves unknown flags and does not claim completion',async()=>{
 const {structuredSourceFields}=await import('../src/lib/source-summary');
 const text=structuredText('social/selvitys',{selvitys_alku_pvm:'2026-10-08',selvitys_loppu_pvm:'2026-10-15',selvitys_nimi:'Palvelutarpeen arviointi',onko_erityistuen_tarve:null,onko_selvitys_pta:true},['selvitys_alku_pvm','selvitys_loppu_pvm','selvitys_nimi','onko_erityistuen_tarve','onko_selvitys_pta']);
 const record={id:'social-assessment',date:'2026-10-08',type:'social' as const,title:'Social assessment record',author:'Source',sourceTable:'social/selvitys',text};
 const fact=summarizeSource(record);assert.match(fact.text,/do not confirm completion/);assert.doesNotMatch(fact.text,/selvitys_|onko_/);
 const fields=structuredSourceFields(record);assert.equal(fields.find(f=>f.label==='Special support flag')?.value,'Not recorded');assert.equal(fields.find(f=>f.label==='Service-needs assessment flag')?.value,'Yes');assert.equal(fields.find(f=>f.label==='Recorded assessment end date')?.value,'2026-10-15');
 validateEvidence({facts:[fact],missing:[]},{...patients[0],records:[record]});assert.equal(record.text,text);
});
