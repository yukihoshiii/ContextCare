import test from 'node:test';
import assert from 'node:assert/strict';
import {patients} from '../src/lib/fixtures';
import {assertIntricSetup,intricBrief,INTRIC_ASSISTANT,INTRIC_MODEL,IntricOutputValidationError,IntricTimeoutError} from '../src/lib/intric';
const setup={id:INTRIC_ASSISTANT,completion_model:{id:INTRIC_MODEL,hosting:'se'},completion_model_alias:null,tools:[],attachments:[],groups:[],websites:[],integration_knowledge_list:[],highlighted_skills:[],logging_enabled:false,data_retention_days:1};
const patient=patients[0];
const content={facts:[{title:'Reported symptom',text:'A recorded symptom requires review.',status:'needs-review',evidence:[{sourceId:patient.records[2].id,quote:patient.records[2].text}]}],missing:[],questions:[{title:'Symptom changes',question:'How has your dizziness changed?',rationale:'The recorded dizziness is relevant to this visit.',evidence:[{sourceId:patient.records[2].id,quote:patient.records[2].text}]}]};
const envelope={session_id:'00000000-0000-4000-8000-000000000001',answer:JSON.stringify(content),model:{id:INTRIC_MODEL},files:[],generated_files:[],references:[],web_search_references:[]};
async function mocked(run:(set:(fn:typeof fetch)=>void)=>Promise<void>){const original=globalThis.fetch,key=process.env.INTRIC_API_KEY;process.env.INTRIC_API_KEY='test-key';try{await run(fn=>{globalThis.fetch=fn;});}finally{globalThis.fetch=original;if(key===undefined)delete process.env.INTRIC_API_KEY;else process.env.INTRIC_API_KEY=key;}}
test('Intric refuses changed model, tools, shared knowledge and retention',()=>{
 assert.doesNotThrow(()=>assertIntricSetup(setup));
 for(const patch of [{completion_model:{id:'other',hosting:'se'}},{completion_model_alias:'fast'},{tools:[{}]},{groups:[{}]},{data_retention_days:null},{logging_enabled:true}])assert.throws(()=>assertIntricSetup({...setup,...patch}));
});
test('Intric starts a fresh session, minimizes input and validates model/evidence',async()=>mocked(async set=>{
 const calls:{url:string,body?:string}[]=[];
 set(async(url,options)=>{calls.push({url:String(url),body:options?.body as string});assert.equal(options?.redirect,'error');return Response.json(calls.length%2===1?setup:envelope);});
 for(let i=0;i<2;i++)assert.deepEqual((await intricBrief(patient,'doctor','Review','2026-10-13','self-authored')).content,content);
 for(const call of calls.filter(c=>c.body)){const body=JSON.parse(call.body!);assert.ok(call.url.endsWith('/sessions/'));assert.equal(body.session_id,undefined);assert.deepEqual(body.files,[]);assert.equal(body.stream,false);assert.ok(!body.question.includes(patient.name));}
}));
test('Intric blocks organizer data and unsafe configuration before generation',async()=>mocked(async set=>{
 let calls=0;set(async()=>{calls++;return Response.json({...setup,tools:[{}]});});
 await assert.rejects(intricBrief(patient,'doctor','Review','2026-10-13','organizer'),/outside the approved/);assert.equal(calls,0);
 await assert.rejects(intricBrief(patient,'doctor','Review','2026-10-13','self-authored'),/without tools/);assert.equal(calls,1);
}));
test('Intric rejects wrong model, external content and forged quotations',async()=>mocked(async set=>{
 for(const patch of [{answer:JSON.stringify({...content,questions:undefined})},{model:{id:'other'}},{web_search_references:[{}]},{answer:JSON.stringify({...content,facts:[{...content.facts[0],evidence:[{sourceId:patient.records[2].id,quote:'made up'}]}]})}]){
  let calls=0;set(async()=>Response.json(++calls===1?setup:{...envelope,...patch}));
  await assert.rejects(intricBrief(patient,'doctor','Review','2026-10-13','self-authored'));
 }
}));


test('Intric retries an unsupported fact once, starts fresh and returns only a verified draft',async()=>mocked(async set=>{
 const bodies:any[]=[];
 const invalid={...content,facts:[{...content.facts[0],evidence:[]}]};
 set(async(url,options)=>{
  if(!String(url).endsWith('/sessions/'))return Response.json(setup);
  const body=JSON.parse(options!.body as string);bodies.push(body);
  return Response.json({...envelope,session_id:`session-${bodies.length}`,answer:JSON.stringify(bodies.length===1?invalid:content)});
 });
 const result=await intricBrief(patient,'doctor','knee pain','2026-10-13','self-authored');
 assert.deepEqual(result.content,content);assert.equal(result.sessionId,'session-2');assert.equal(bodies.length,2);
 assert.ok(bodies[1].question.includes('SERVER VALIDATION FEEDBACK'));assert.ok(bodies[1].question.includes('evidence: []'));
 assert.equal(bodies[1].session_id,undefined);assert.ok(!bodies[1].question.includes(JSON.stringify(invalid)));
}));
test('Intric never accepts invented evidence and limits correction to one retry',async()=>mocked(async set=>{
 let generations=0;
 set(async url=>{if(!String(url).endsWith('/sessions/'))return Response.json(setup);generations++;return Response.json({...envelope,answer:JSON.stringify({...content,questions:[{...content.questions[0],evidence:[{sourceId:patient.records[2].id,quote:'fabricated'}]}]})});});
 await assert.rejects(intricBrief(patient,'doctor','knee pain','2026-10-13','self-authored'),IntricOutputValidationError);assert.equal(generations,2);
}));
test('retry rechecks approved setup and refuses configuration changes before retransmitting',async()=>mocked(async set=>{
 let setups=0,generations=0;
 set(async url=>{if(!String(url).endsWith('/sessions/'))return Response.json(++setups===1?setup:{...setup,tools:[{}]});generations++;return Response.json({...envelope,answer:JSON.stringify({...content,facts:[{...content.facts[0],evidence:[]}]})});});
 await assert.rejects(intricBrief(patient,'doctor','knee pain','2026-10-13','self-authored'),/without tools/);assert.equal(generations,1);assert.equal(setups,2);
}));
test('cancellation stops correction before a second patient transmission',async()=>mocked(async set=>{
 const controller=new AbortController();let generations=0;
 set(async url=>{if(!String(url).endsWith('/sessions/'))return Response.json(setup);generations++;controller.abort();return Response.json({...envelope,answer:JSON.stringify({...content,facts:[{...content.facts[0],evidence:[]}]})});});
 await assert.rejects(intricBrief(patient,'doctor','knee pain','2026-10-13','self-authored',controller.signal),{name:'AbortError'});assert.equal(generations,1);
}));


test('correction has a fresh generation deadline even when the first deadline expires',async t=>mocked(async set=>{
 const deadlines:{ms:number,controller:AbortController}[]=[];
 t.mock.method(AbortSignal,'timeout',(ms:number)=>{const controller=new AbortController();deadlines.push({ms,controller});return controller.signal;});
 let generations=0;
 set(async(url,options)=>{
  if(!String(url).endsWith('/sessions/'))return Response.json(setup);
  generations++;
  if(generations===2){
   deadlines[1].controller.abort(new DOMException('First deadline expired','TimeoutError'));
   assert.equal(options!.signal!.aborted,false);
  }
  return Response.json({...envelope,answer:JSON.stringify(generations===1?{...content,facts:[{...content.facts[0],evidence:[]}]}:content)});
 });
 assert.deepEqual((await intricBrief(patient,'doctor','knee pain','2026-10-13','self-authored')).content,content);
 assert.deepEqual(deadlines.map(d=>d.ms),[15000,120000,15000,120000]);
 assert.equal(generations,2);
}));
test('generation timeout is explicit and does not send another patient request',async()=>mocked(async set=>{
 let generations=0;
 set(async url=>{if(!String(url).endsWith('/sessions/'))return Response.json(setup);generations++;throw new DOMException('Expired','TimeoutError');});
 await assert.rejects(intricBrief(patient,'doctor','Review','2026-10-13','self-authored'),error=>error instanceof IntricTimeoutError&&error.phase==='generation');
 assert.equal(generations,1);
}));
test('client cancellation takes priority over a concurrent provider timeout',async()=>mocked(async set=>{
 const controller=new AbortController();
 set(async url=>{if(!String(url).endsWith('/sessions/'))return Response.json(setup);controller.abort();throw new DOMException('Expired','TimeoutError');});
 await assert.rejects(intricBrief(patient,'doctor','Review','2026-10-13','self-authored',controller.signal),{name:'AbortError'});
}));
test('brief HTTP endpoint returns a useful 504 for an Intric timeout',async()=>mocked(async set=>{
 const {POST}=await import('../src/app/api/brief/route');
 const provider=process.env.AI_PROVIDER,store=process.env.PATIENT_STORE;
 process.env.AI_PROVIDER='intric';process.env.PATIENT_STORE='fixtures';
 try {
  set(async url=>String(url).endsWith('/sessions/')?new Response(null,{status:504}):Response.json(setup));
  const response=await POST(new Request('http://localhost:3000/api/brief',{method:'POST',headers:{'Content-Type':'application/json',host:'localhost:3000',origin:'http://localhost:3000'},body:JSON.stringify({patientId:patient.id,role:'doctor',visitReason:'Review',asOfDate:'2026-10-13'})}));
  assert.equal(response.status,504);assert.equal(response.headers.get('cache-control'),'no-store');assert.match((await response.json()).error,/Intric took too long/);
 }finally{if(provider===undefined)delete process.env.AI_PROVIDER;else process.env.AI_PROVIDER=provider;if(store===undefined)delete process.env.PATIENT_STORE;else process.env.PATIENT_STORE=store;}
}));
