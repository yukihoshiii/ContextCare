import {diagnosisTextParts} from '@/lib/diagnosis-labels';
export function DiagnosisText({text,labels}:{text:string;labels?:Map<string,string>}){
 if(!labels)return <>{text}</>;
 return <>{diagnosisTextParts(text,labels).map((part,i)=>part.name?<span className="diagnosis-label" key={i} title="Diagnosis name recorded in this patient's notes"><span>{part.name}</span><small className="diagnosis-code">{part.text}</small></span>:part.text)}</>;
}
