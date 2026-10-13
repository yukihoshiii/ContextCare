import 'server-only';
import { assertExternalTransmissionAllowed } from './data-policy';
import { readLimitedBody } from './body';
import { briefInput, briefSystemPrompt } from './prompt';
import { validateEvidence, type Patient, type Role } from './schema';

export class AIConfigurationError extends Error {}

// Fixed EU endpoint: no patient-supplied URLs, files, tools or persisted conversations.
export async function mistralBrief(patient: Patient, role: Role, visitReason: string, asOfDate: string, origin: string | undefined, signal?: AbortSignal) {
  assertExternalTransmissionAllowed(origin);
  const key = process.env.MISTRAL_API_KEY?.trim();
  const model = process.env.MISTRAL_MODEL?.trim();
  if (!key || !model) throw new AIConfigurationError('Mistral requires a server-side API key and model ID.');
  if (!/^[a-zA-Z0-9._:-]{1,150}$/.test(model)) throw new AIConfigurationError('Invalid Mistral model configuration.');
  const body = JSON.stringify({
    model, stream: false, temperature: 0, max_tokens: 3000,
    response_format: { type: 'json_object' }, tool_choice: 'none',
    messages: [
      { role: 'system', content: briefSystemPrompt() },
      { role: 'user', content: JSON.stringify(briefInput(patient, role, visitReason, asOfDate)) },
    ],
  });
  // Refuse oversized histories rather than silently hiding records from the model.
  if (Buffer.byteLength(body, 'utf8') > 120000) throw new Error('AI context too large; source selection is required.');
  signal?.throwIfAborted();
  const response = await fetch('https://api.eu.mistral.ai/v1/chat/completions', {
    method: 'POST', redirect: 'error', cache: 'no-store',
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(25000)]) : AbortSignal.timeout(25000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body,
  });
  // Never surface or log an upstream response that may contain input or credentials.
  if (!response.ok) throw new Error('Mistral request failed.');
  const envelope = JSON.parse(await readLimitedBody(response.body, 64000));
  const choice = envelope?.choices?.[0];
  if (choice?.finish_reason !== 'stop' || choice?.message?.role !== 'assistant' ||
      typeof choice?.message?.content !== 'string' || choice?.message?.tool_calls?.length) {
    throw new Error('Mistral did not return a complete text response.');
  }
  return validateEvidence(JSON.parse(choice.message.content), patient);
}
