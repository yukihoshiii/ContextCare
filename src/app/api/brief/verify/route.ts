import { BodyTooLarge, readLimitedBody } from '@/lib/body';
import { manualRequestSchema, verifyManualBrief } from '@/lib/manual-brief';
import { getRepository } from '@/lib/repository';
export const runtime = 'nodejs';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) { try { if (new URL(origin).host !== request.headers.get('host')) return reply({error:'Cross-origin request rejected.'},403); } catch { return reply({error:'Invalid origin.'},403); } }
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({error:'JSON required.'},415);
  try {
    const raw = await readLimitedBody(request.body, 65536);
    let input: unknown; try { input = JSON.parse(raw); } catch { return reply({error:'Invalid JSON.'},400); }
    const parsed = manualRequestSchema.safeParse(input);
    if (!parsed.success) return reply({error:'Invalid patient, role or visit context.'},400);
    const patient = await (await getRepository()).get(parsed.data.patientId);
    if (!patient) return reply({error:'Patient not found.'},404);
    try { return reply(verifyManualBrief(parsed.data,patient)); }
    catch { return reply({error:'Response rejected: invalid format, unknown source or quotation absent from this patient’s records.'},422); }
  } catch (e) { return reply({error:e instanceof BodyTooLarge ? 'Response too large (64 KiB maximum).' : 'Could not verify response.'},e instanceof BodyTooLarge ? 413 : 500); }
}
