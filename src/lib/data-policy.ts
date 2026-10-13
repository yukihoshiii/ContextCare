export type DataOrigin = 'self-authored' | 'organizer';
export class RestrictedDataError extends Error {}
export function assertExternalTransmissionAllowed(origin: string | undefined) {
  if (origin !== 'self-authored') throw new RestrictedDataError('External AI is disabled for organizer or unclassified datasets.');
}
