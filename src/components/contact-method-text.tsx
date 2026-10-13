export function ContactMethodText({name,code}:{name:string;code:string}){
 return <span title="Hilmo contact method"><span>{name}</span><small className="diagnosis-code">{code}</small></span>;
}
