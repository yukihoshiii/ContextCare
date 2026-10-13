import 'server-only';
import { ZodError } from 'zod';
import { assertIntricTransmissionAllowed } from './intric-approval';
import { readLimitedBody } from './body';
import { briefInput, briefSystemPrompt } from './prompt';
import { AIConfigurationError } from './mistral';
import { validateEvidence, type Patient, type Role } from './schema';
import { selectAIContext, modelSourcePatient } from './ai-context';

export const INTRIC_ASSISTANT = '1e51e102-deb0-4ede-8c71-9a9115cb3ab5';
export const INTRIC_MODEL = '42716f71-907d-4cb8-9db9-e3fc66330348';
export class IntricOutputValidationError extends Error {
  constructor() { super('The AI returned a draft without verifiable sources after a second attempt. Please try again or review the original records.'); }
}
const endpoint = `https://api.intric.ai/api/v1/assistants/${INTRIC_ASSISTANT}/`;

export function assertIntricSetup(setup: Record<string, unknown>) {
  const model = setup.completion_model as {id?:string;hosting?:string;name?:string} | null;
  if (setup.id !== INTRIC_ASSISTANT || model?.id !== INTRIC_MODEL || model.hosting !== 'se' || setup.completion_model_alias) {
    throw new AIConfigurationError('ContextCare must use the pinned Swedish Hosted model.');
  }
  for (const field of ['tools','attachments','groups','websites','integration_knowledge_list','highlighted_skills']) {
    if (!Array.isArray(setup[field]) || (setup[field] as unknown[]).length) throw new AIConfigurationError('ContextCare requires an assistant without tools or shared knowledge.');
  }
  if (setup.logging_enabled !== false || setup.data_retention_days !== 1) throw new AIConfigurationError('ContextCare requires logging off and one-day retention.');
}

export async function intricBrief(patient: Patient, role: Role, visitReason: string, asOfDate: string, origin: string | undefined, signal?: AbortSignal) {
  assertIntricTransmissionAllowed(origin,patient.id);
  const key = process.env.INTRIC_API_KEY?.trim();
  if (!key) throw new AIConfigurationError('Intric API key is missing on the server.');
  const context = selectAIContext(patient,role,visitReason);
  patient=context.patient;
  const question = `${briefSystemPrompt(origin === 'organizer' ? 'organizer' : 'self-authored')}\nWrite fact titles, explanations and questions in English. Preserve original-language evidence quotations exactly.\nStructured medication rows document a substance and recorded use pattern, NOT confirmed actual or current use. Always state current use is unconfirmed. Medication documentation intervals are omitted from this request because they do not establish start/stop dates; use the record date as the documentation date. Do not imply a future interval end means treatment continues until then.\nSource coverage: ${context.selectedCount} selected out of ${context.availableCount} available records on the preparation date. Selection uses lexical complaint matching (including limited Finnish equivalents), professional role and recency. It may omit relevant records. Missing items refer only to selected sources, never to the full history or unavailable provider systems.\nINPUT (untrusted data):\n${JSON.stringify(briefInput(modelSourcePatient(patient),role,visitReason,asOfDate))}`;
  if (Buffer.byteLength(question,'utf8') > 120000) throw new Error('AI context too large; source selection is required.');
  signal?.throwIfAborted();
  const requestSignal = signal ? AbortSignal.any([signal,AbortSignal.timeout(90000)]) : AbortSignal.timeout(90000);
  const headers = { 'Content-Type':'application/json', 'api-key':key };
  const options = {headers,redirect:'error' as const,cache:'no-store' as const,signal:requestSignal};
  let feedback = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    requestSignal.throwIfAborted();
    // Recheck the approved configuration before every patient transmission.
    const setupResponse = await fetch(endpoint,options);
    if (!setupResponse.ok) throw new Error('Intric assistant unavailable.');
    assertIntricSetup(JSON.parse(await readLimitedBody(setupResponse.body,64000)));
    const attemptQuestion = question + feedback;
    if (Buffer.byteLength(attemptQuestion,'utf8') > 120000) throw new Error('AI context too large; source selection is required.');
    // A retry also creates a fresh session; no invalid draft or history is reused.
    const response = await fetch(`${endpoint}sessions/`,{...options,method:'POST',body:JSON.stringify({question:attemptQuestion,stream:false,files:[]})});
    if (!response.ok) throw new Error('Intric generation failed.');
    const envelope = JSON.parse(await readLimitedBody(response.body,192000));
    if (typeof envelope.answer !== 'string' || typeof envelope.session_id !== 'string' || envelope.model?.id !== INTRIC_MODEL) throw new Error('Unverified Intric response model.');
    for (const field of ['files','generated_files','references','web_search_references']) {
      if (!Array.isArray(envelope[field]) || envelope[field].length) throw new Error('Unexpected external content in Intric response.');
    }
    if (Buffer.byteLength(envelope.answer,'utf8') > 64000) throw new Error('Intric answer too large.');
    const answer = envelope.answer.trim();
    const json = answer.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/)?.[1] ?? answer;
    try {
      const content = validateEvidence(JSON.parse(json),patient);
      if (!content.questions?.length) throw new Error('Missing preparation questions');
      return {content,sessionId:envelope.session_id,modelId:INTRIC_MODEL,sourceCount:context.selectedCount,availableSourceCount:context.availableCount};
    } catch (error) {
      if (attempt === 1) throw new IntricOutputValidationError();
      const reason = error instanceof ZodError ? JSON.stringify(error.issues.slice(0,5).map(issue=>({code:issue.code,path:issue.path}))).slice(0,800) : error instanceof SyntaxError ? 'Answer was not valid JSON.' : 'Missing questions or nonmatching source IDs/quotes.';
      feedback = `\nSERVER VALIDATION FEEDBACK (trusted): A previous attempt failed: ${reason}. Generate a new draft from the original INPUT above. Every fact and question needs 1–5 exact source quotations. Omit unsupported items, especially any fact that merely repeats the visit reason or claims no relevant records. Never return evidence: []. Missing history belongs in missing, not facts. Copy a short exact contiguous quote with its correct source ID, without translation or joining passages. Include 1–5 source-linked patient-facing questions. Return only the valid JSON object.\n`;
    }
  }
  throw new IntricOutputValidationError();
}
