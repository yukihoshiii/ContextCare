import test from 'node:test';
import assert from 'node:assert/strict';
import {contactMethodLabel} from '../src/lib/contact-methods';
import {structuredSourceFields,summarizeSource} from '../src/lib/source-summary';
import {validateEvidence} from '../src/lib/schema';
import {patients} from '../src/lib/fixtures';
const record={id:'authored-contact',date:'2026-09-01',type:'visit' as const,title:'Authored contact',author:'Test',sourceTable:'clinical/kontakti',text:'yhteystapa_koodi_hilmo: "R10"\nkesto_minuutit_kpl: 20'};
test('Hilmo method displays its name while original code and exact evidence remain intact',()=>{
 const original=structuredClone(record);const fact=summarizeSource(record);
 assert.match(fact.text,/Contact method: In-person appointment \(R10\)/);
 const field=structuredSourceFields(record)[0];assert.equal(field.label,'Contact method');assert.equal(field.value,'R10');assert.equal(field.contactMethod?.name,'In-person appointment');
 assert.equal(field.quote,'yhteystapa_koodi_hilmo: "R10"');assert.deepEqual(record,original);
 validateEvidence({facts:[fact],missing:[]},{...patients[0],records:[record]});
});
test('contact decoding does not reinterpret diagnoses, social codes or unknown methods',()=>{
 for(const [table,field,code] of [['clinical/diagnoosi','icd10_id','R10'],['social/kontakti','yhteystapa_id','R52'],['clinical/kontakti','yhteystapa_koodi_hilmo','R999'],['clinical/kontakti','yhteystapa_koodi_hilmo','R10.4']])assert.equal(contactMethodLabel(table,field,code),undefined);
 assert.equal(contactMethodLabel('clinical/kontakti','yhteystapa_koodi_hilmo','R52')?.name,'Real-time remote contact');
 assert.equal(contactMethodLabel('clinical/kontakti','yhteystapa_koodi_hilmo','R56')?.name,'Asynchronous remote contact');
 const fact=summarizeSource({...record,text:'yhteystapa_koodi_hilmo: "R999"'});assert.match(fact.text,/Contact method code: R999/);
});


test('all contact methods present in the delivered clinical and social tables are readable',()=>{
 for(const [table,field,code,name] of [
  ['clinical/kontakti','yhteystapa_koodi_hilmo','R10','In-person appointment'],
  ['clinical/kontakti','yhteystapa_koodi_hilmo','R52','Real-time remote contact'],
  ['social/kontakti','yhteystapa_id','R10','In-person appointment'],
  ['social/kontakti','yhteystapa_id','R20','Home visit'],
 ]){
  const source={...record,sourceTable:table,text:`${field}: "${code}"`};const original=structuredClone(source);
  const fact=summarizeSource(source);const display=structuredSourceFields(source)[0];
  assert.equal(display.contactMethod?.name,name);assert.equal(display.contactMethod?.code,code);
  assert.ok(fact.text.includes(name));assert.deepEqual(source,original);
  validateEvidence({facts:[fact],missing:[]},{...patients[0],records:[source]});
 }
});
test('remaining Hilmo and historical contact codes have distinct display labels',()=>{
 for(const code of ['R10','R20','R30','R40','R41','R50','R51','R52','R55','R56','R60','R70','R71','R72','R80','R90'])assert.ok(contactMethodLabel('clinical/kontakti','yhteystapa_koodi_hilmo',code)?.name);
 assert.equal(contactMethodLabel('clinical/kontakti','yhteystapa_koodi_hilmo','R60')?.name,'Consultation between professionals');
 assert.equal(contactMethodLabel('social/kontakti','yhteystapa_koodi_hilmo','R20'),undefined);
});
