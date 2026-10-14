import 'server-only';
import { ZodError } from 'zod';
import { assertIntricTransmissionAllowed } from './intric-approval';
import { readLimitedBody } from './body';
import { briefInput, briefSystemPrompt } from './prompt';
import { AIConfigurationError } from './mistral';
import { EvidenceValidationError, type Patient, type Role } from './schema';
import { selectAIContext, modelSourcePatient } from './ai-context';
import {validateIntricDraft} from './structured-citations';
import { parseBriefJSON } from './brief-json';

export const INTRIC_ASSISTANT = '1e51e102-deb0-4ede-8c71-9a9115cb3ab5';
export const INTRIC_MODEL = '42716f71-907d-4cb8-9db9-e3fc66330348';
export class IntricOutputValidationError extends Error {
  constructor() { super('The AI returned a draft without verifiable sources after a second attempt. Please try again or review the original records.'); }
}
export class IntricTimeoutError extends Error {
  constructor(public readonly phase: 'configuration' | 'generation') {
    super(phase === 'generation' ? 'Intric took too long to prepare a verified brief. Please try again.' : 'Intric configuration check timed out. Please try again.');
  }
}
const endpoint = `https://api.intric.ai/api/v1/assistants/${INTRIC_ASSISTANT}/`;

// Each correction gets its full budget; client cancellation still stops every step.
async function intricStep<T>(phase: 'configuration' | 'generation', attempt: number, signal: AbortSignal | undefined, load: (stepSignal: AbortSignal) => Promise<T>): Promise<T> {
  signal?.throwIfAborted();
  const timeout = AbortSignal.timeout(phase === 'configuration' ? 15000 : 600000);
  const stepSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const started = Date.now();
  try { return await load(stepSignal); }
  catch (error) {
    signal?.throwIfAborted();
    if (timeout.aborted || error instanceof Error && error.name === 'TimeoutError') throw new IntricTimeoutError(phase);
    throw error;
  } finally {
    if (process.env.NODE_ENV === 'development') console.info('Intric request timing:', {phase, attempt: attempt + 1, elapsedMs: Date.now() - started});
  }
}

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
  const headers = { 'Content-Type':'application/json', 'api-key':key };
  const options = {headers,redirect:'error' as const,cache:'no-store' as const};
  let feedback = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    signal?.throwIfAborted();
    // Recheck the approved configuration before every patient transmission.
    const setup = await intricStep('configuration', attempt, signal, async stepSignal => {
      const response = await fetch(endpoint,{...options,signal:stepSignal});
      if (response.status === 504 || response.status === 408) throw new IntricTimeoutError('configuration');
      if (!response.ok) throw new Error('Intric assistant unavailable.');
      return JSON.parse(await readLimitedBody(response.body,64000));
    });
    assertIntricSetup(setup);
    const attemptQuestion = question + feedback;
    if (Buffer.byteLength(attemptQuestion,'utf8') > 120000) throw new Error('AI context too large; source selection is required.');
    // A retry also creates a fresh session; no invalid draft or history is reused.
    const envelope = await intricStep('generation', attempt, signal, async stepSignal => {
      const response = await fetch(`${endpoint}sessions/`,{...options,signal:stepSignal,method:'POST',body:JSON.stringify({question:attemptQuestion,stream:false,files:[]})});
      if (response.status === 504 || response.status === 408) throw new IntricTimeoutError('generation');
      if (!response.ok) throw new Error('Intric generation failed.');
      return JSON.parse(await readLimitedBody(response.body,192000));
    });
    if (typeof envelope.answer !== 'string' || typeof envelope.session_id !== 'string' || envelope.model?.id !== INTRIC_MODEL) throw new Error('Unverified Intric response model.');
    for (const field of ['files','generated_files','references','web_search_references']) {
      if (!Array.isArray(envelope[field]) || envelope[field].length) throw new Error('Unexpected external content in Intric response.');
    }
    if (Buffer.byteLength(envelope.answer,'utf8') > 64000) throw new Error('Intric answer too large.');
    try {
      const {content,restoredSourceExcerpts} = validateIntricDraft(parseBriefJSON(envelope.answer),patient);
      if (!content.questions?.length && !content.missing.length) throw new Error('Missing preparation questions');
      return {content,restoredSourceExcerpts,sessionId:envelope.session_id,modelId:INTRIC_MODEL,sourceCount:context.selectedCount,availableSourceCount:context.availableCount};
    } catch (error) {
      // Log positions and categories only, never model output, IDs or quote text.
      const diagnostic = error instanceof ZodError ? {kind:'schema',issues:error.issues.slice(0,5).map(issue=>({code:issue.code,path:issue.path}))}
        : error instanceof EvidenceValidationError ? {kind:error.reason,path:error.path}
        : error instanceof SyntaxError ? {kind:'invalid-json'}
        : error instanceof Error && error.message === 'Missing preparation questions' ? {kind:'missing-questions'} : {kind:'invalid-output'};
      if (process.env.NODE_ENV === 'development') console.warn('Intric draft rejected:', {attempt:attempt+1,willRetry:attempt===0,...diagnostic});
      if (attempt === 1) throw new IntricOutputValidationError();
      const reason = JSON.stringify(diagnostic).slice(0,800);
      feedback = `\nSERVER VALIDATION FEEDBACK (trusted): A previous attempt failed: ${reason}. Generate a new draft from the original INPUT above. Every fact and question needs 1–5 exact source quotations. Omit unsupported items, especially any fact that merely repeats the visit reason or claims no relevant records. Never return evidence: []. Missing history belongs in missing, not facts. Copy a short exact contiguous quote with its correct source ID, without translation or joining passages. Include source-linked questions when supported; questions may be [] if missing includes useful clarification questions. Return only the valid JSON object.\n`;
    }
  }
  throw new IntricOutputValidationError();
}
