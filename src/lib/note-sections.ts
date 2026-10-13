export type NoteSection = { heading: string; text: string; start: number; end: number };
export function noteSections(text:string):NoteSection[]{
 const matches=[...text.matchAll(/(?:^|\n)\\?#{1,6}[ \t]+([^\r\n]+)\r?\n/g)];
 return matches.map((match,index)=>{const from=match.index!+match[0].length;const to=matches[index+1]?.index??text.length;const body=text.slice(from,to);const leading=body.search(/\S/);const trimmed=body.trim();return {heading:match[1].trim(),text:trimmed,start:from+Math.max(0,leading),end:from+Math.max(0,leading)+trimmed.length};}).filter(s=>s.text);
}
export function completeExcerpt(text:string,budget:number):string {
 if(text.length<=budget)return text;
 const candidate=text.slice(0,budget);const ends=[...candidate.matchAll(/[.!?](?=\s|$)/g)];
 return ends.length?candidate.slice(0,ends.at(-1)!.index!+1).trim():'';
}
