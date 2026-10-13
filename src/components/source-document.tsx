import {ContactMethodText} from './contact-method-text';
import {DiagnosisText} from './diagnosis-text';
import type {PatientRecord} from '@/lib/schema';
import {structuredSourceFields} from '@/lib/source-summary';
import { noteSections } from '@/lib/note-sections';
export function SourceDocument({text,quote,record,diagnoses}:{text:string;quote:string;record?:PatientRecord;diagnoses?:Map<string,string>}){
 const sections=noteSections(text);const start=quote?text.indexOf(quote):-1;const end=start+quote.length;
 function content(body:string,offset:number){const from=Math.max(start,offset);const to=Math.min(end,offset+body.length);return start>=0&&from<to?<>{body.slice(0,from-offset)}<mark>{body.slice(from-offset,to-offset)}</mark>{body.slice(to-offset)}</>:body;}
 if(record?.sourceTable){
  const fields=structuredSourceFields(record);
  if(fields.length)return <>
   <div className="source-fields">{fields.map((field,i)=>{
    const value=field.contactMethod?<ContactMethodText {...field.contactMethod}/>:field.label==='Contact method code'?field.value:<DiagnosisText text={field.value} labels={diagnoses}/>;
    const label=field.label==='Diagnosis code'&&diagnoses?.has(field.value)?'Diagnosis':field.label;
    return <p key={i}><strong>{label}:</strong> {field.quote===quote?<mark>{value}</mark>:value}</p>;
   })}</div>
   {record.sourceTable==='social/selvitys'&&<p className="source-caveat">Recorded dates do not confirm that the assessment was completed.</p>}
   <details className="raw-source"><summary>Original fields</summary><pre>{content(text,0)}</pre></details>
  </>;
 }
 if(!sections.length)return <>{content(text,0)}</>;
 return <>{sections.map(section=><section className="note-section" key={section.start}><h3>{section.heading}</h3><p>{content(section.text,section.start)}</p></section>)}</>;
}
