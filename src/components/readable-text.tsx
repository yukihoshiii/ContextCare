export function ReadableText({text}:{text:string}) {
 return <div className="fact-body">{text.split('\n').filter(Boolean).map((line,i)=>{
  const part=line.match(/^([^:]{1,50}): (.+)$/);
  return <p key={i}>{part?<><strong>{part[1]}:</strong> {part[2]}</>:line}</p>;
 })}</div>;
}
