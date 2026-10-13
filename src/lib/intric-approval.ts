import 'server-only';
import { resolve } from 'node:path';
import { assertExternalTransmissionAllowed, RestrictedDataError } from './data-policy';

// User explicitly confirmed organizer permission on 13 October 2026.
// Scope: delivered Veil database, ContextCare assistant, pinned Swedish Hosted only.
// The Intric adapter separately verifies the exact endpoint/model/configuration.
export function assertIntricTransmissionAllowed(origin: string | undefined, patientId: string) {
  if (origin === 'self-authored') return;
  const deliveredDatabase = resolve(process.cwd(), 'data/veil-full.sqlite');
  const configuredDatabase = resolve(/* turbopackIgnore: true */ process.cwd(), process.env.DATABASE_PATH || './data/contextcare.sqlite');
  const deliveredProfile = /^veil:(2024-2026:linked|2025:clinical|2025:social):SYN-ASI-[0-9]+$/.test(patientId);
  if (origin === 'organizer' && configuredDatabase === deliveredDatabase && deliveredProfile) return;
  if (origin === 'organizer') throw new RestrictedDataError('This organizer dataset is outside the approved Intric processing scope.');
  assertExternalTransmissionAllowed(origin);
}
