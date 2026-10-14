import {briefContentSchema,validateEvidence,type Patient} from './schema';

// Recover only a source-exact span between literally quoted medication fields.
// No fuzzy matches, value corrections, source-ID aliases or prose repair.
export function validateIntricDraft(input:unknown,patient:Patient){
 const parsed=briefContentSchema.parse(input);let restoredSourceExcerpts=0;
 for(const item of [...parsed.facts,...(parsed.questions||[])])for(const evidence of item.evidence){
  const record=patient.records.find(r=>r.id===evidence.sourceId);
  if(!record||record.text.includes(evidence.quote)||record.sourceTable!=='clinical/laakitys')continue;
  const cited=evidence.quote.split('\n');
  if(cited.length<2||!cited.every(line=>{
   const match=line.match(/^(vaikuttava_aine|atc_koodi|laakkeen_kayttotapa|on_resepti): (.+)$/);
   if(!match)return false;
   try{JSON.parse(match[2]);return true;}catch{return false;}
  }))continue;
  const original=record.text.split('\n');
  const positions=cited.map(line=>original.flatMap((value,index)=>value===line?[index]:[]));
  if(positions.some(indices=>indices.length!==1))continue;
  const indices=positions.map(matches=>matches[0]);
  if(indices.some((index,i)=>i>0&&index<=indices[i-1]))continue;
  const span=original.slice(indices[0],indices.at(-1)!+1).join('\n');
  if(span.length>1000)continue;
  evidence.quote=span;restoredSourceExcerpts++;
 }
 return {content:validateEvidence(parsed,patient),restoredSourceExcerpts};
}
