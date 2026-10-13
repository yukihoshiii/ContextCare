import { ZodError } from 'zod';
import { IntricOutputValidationError, IntricTimeoutError } from '@/lib/intric';
import { RestrictedDataError } from '@/lib/data-policy';
import { BodyTooLarge, readLimitedBody } from '@/lib/body';
import { briefRequestSchema } from '@/lib/schema';
import { getRepository } from '@/lib/repository';
import { briefProvider } from '@/lib/provider';
import { NoContextRecordsError } from '@/lib/record-context';
import { AIConfigurationError } from '@/lib/mistral';
export const runtime = 'nodejs';
// Local synthetic prototype only. Shared store + authenticated identity required for deployment.
let windowStart = Date.now();
let count = 0;
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    try { if (new URL(origin).host !== request.headers.get('host')) return reply({ error: 'Cross-origin request rejected.' }, 403); }
    catch { return reply({ error: 'Invalid origin.' }, 403); }
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'JSON required.' }, 415);
  if (Date.now() - windowStart > 60000) { count = 0; windowStart = Date.now(); }
  if (++count > 20) return reply({ error: 'Too many requests. Try again in a minute.' }, 429);
  try {
    const raw = await readLimitedBody(request.body, 4096);
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return reply({ error: 'Invalid JSON.' }, 400); }
    const parsed = briefRequestSchema.safeParse(input);
    if (!parsed.success) return reply({ error: 'Check patient, role and visit reason (3–500 characters).' }, 400);
    const patient = await (await getRepository()).get(parsed.data.patientId);
    if (!patient) return reply({ error: 'Patient not found.' }, 404);
    return reply(await briefProvider.generate(patient, parsed.data.role, parsed.data.visitReason, parsed.data.asOfDate, request.signal));
  } catch (error) { if (error instanceof IntricTimeoutError) return reply({ error: error.message }, 504); if (error instanceof IntricOutputValidationError) return reply({ error: error.message }, 502); if (error instanceof AIConfigurationError) return reply({ error: error.message }, 503); if (error instanceof NoContextRecordsError) return reply({ error: error.message }, 422); if (error instanceof RestrictedDataError) return reply({ error: error.message }, 403); if (error instanceof BodyTooLarge) return reply({ error: 'Request too large.' }, 413); if (process.env.NODE_ENV === 'development') console.warn('Brief generation rejected:', error instanceof ZodError ? error.issues.map(issue => ({code:issue.code,path:issue.path})) : error instanceof Error && ['Invalid evidence','Intric response is missing source-linked preparation questions.','Intric generation failed.','Unexpected external content in Intric response.'].includes(error.message) ? error.message : error instanceof Error ? error.name : 'Unknown error'); return reply({ error: 'Brief could not be generated or verified. Please retry.' }, 502); }
}
