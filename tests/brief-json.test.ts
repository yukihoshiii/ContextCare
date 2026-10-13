import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBriefJSON} from '../src/lib/brief-json';
const value={quote:'example_field: "Example value"\nother_field: true'};
const json=JSON.stringify(value);
test('plain JSON and complete code fences preserve quotes and newlines exactly',()=>{
 for(const answer of [json,`\n${json}\n`,`\`\`\`json\n${json}\n\`\`\``,`\`\`\`json${json}\`\`\``,`\`\`\`\r\n${json}\r\n\`\`\``])assert.deepEqual(parseBriefJSON(answer),value);
});
test('malformed JSON and surrounding SVG or prose are rejected rather than guessed',()=>{
 for(const answer of ['{"quote":"unfinished}',`${json}\nsvg`,`<svg>${json}</svg>`,`Here is the answer: ${json}`,`\`\`\`json\n${json}\n\`\`\`\nsvg`])assert.throws(()=>parseBriefJSON(answer),SyntaxError);
});

test('format handling never relaxes exact source quotation checks',async()=>{
 const {validateEvidence}=await import('../src/lib/schema');
 const {patients}=await import('../src/lib/fixtures');
 const patient=structuredClone(patients[0]);
 patient.records=[{...patient.records[0],text:'example_field: "Example value"\nbetween_field: false\nother_field: true'}];
 const content=(quote:string)=>({facts:[{title:'Example',text:'An authored test observation.',status:'documented',evidence:[{sourceId:patient.records[0].id,quote}]}],missing:[]});
 assert.doesNotThrow(()=>validateEvidence(parseBriefJSON(JSON.stringify(content('example_field: "Example value"'))),patient));
 for(const quote of ['example_field: Example value','example_field: "Example value"\nother_field: true'])assert.throws(()=>validateEvidence(parseBriefJSON(JSON.stringify(content(quote))),patient),/Invalid evidence/);
});
