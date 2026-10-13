import {contactMethodLabel,contactMethodField} from '@/lib/contact-methods';
import {ContactMethodText} from './contact-method-text';
import {DiagnosisText} from './diagnosis-text';
export function ReadableText({text,diagnoses,sourceTable}:{text:string;diagnoses?:Map<string,string>;sourceTable?:string}) {
 return <div className="fact-body">{text.split('\n').filter(Boolean).map((line,i)=>{
  const part=line.match(/^([^:]{1,50}): (.+)$/);
  const contact=part?.[1]==='Contact method'||part?.[1]==='Contact method code';
  const code=contact?(part![2].match(/\((R\d{2})\)\.?$/)?.[1]||part![2].match(/^(R\d{2})\.?$/)?.[1]):undefined;
  const method=contactMethodLabel(sourceTable,contactMethodField(sourceTable)||'',code);
  return <p key={i}>{part?<><strong>{method?'Contact method':part[1]==='Diagnosis code'&&diagnoses?.has(part[2].replace(/\.$/,''))?'Diagnosis':part[1]}:</strong> {method?<ContactMethodText {...method}/>:part[1]==='Contact method code'?part[2]:<DiagnosisText text={part[2]} labels={diagnoses}/>}</>:<DiagnosisText text={line} labels={diagnoses}/>}</p>;
 })}</div>;
}
