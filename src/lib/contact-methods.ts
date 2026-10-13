// English display labels for Hilmo contact methods, including historical codes.
// THL: https://sotkanet.fi/sotkanet/fi/metadata/indicators/2395
// Hilmo guide: https://www.julkari.fi/bitstreams/815cfc9b-1634-41f6-9a78-e3d90c6bd1a3/download
const hilmo:Record<string,string>={
 R10:'In-person appointment',R20:'Home visit',R30:'Workplace visit',
 R40:'Hospital visit',R41:'Visit at another location',
 R50:'Telephone contact',R51:'Electronic contact',R52:'Real-time remote contact',
 R55:'Letter correspondence',R56:'Asynchronous remote contact',
 R60:'Consultation between professionals',R70:'Record entry without patient contact',
 R71:'Discussion between professionals',R72:'Handling the patient’s matter without direct contact',
 R80:'Inpatient care',R90:'Other contact',
};
// Only the R10/R20 methods used by the supplied social-contact delivery.
// The supplied home-care compatibility view explicitly labels national R20
// as a professional's visit to the client's home. Do not treat arbitrary
// social classification IDs as Hilmo codes.
const deliveredSocial:Record<string,string>={R10:'In-person appointment',R20:'Home visit'};
export function contactMethodField(table:string|undefined):string|undefined{
 if(table==='clinical/kontakti')return 'yhteystapa_koodi_hilmo';
 if(table==='social/kontakti')return 'yhteystapa_id';
}
export function contactMethodLabel(table:string|undefined,field:string,value:unknown):{name:string;code:string}|undefined{
 if(typeof value!=='string'||field!==contactMethodField(table))return;
 const name=(table==='clinical/kontakti'?hilmo:deliveredSocial)[value];
 return name?{name,code:value}:undefined;
}
