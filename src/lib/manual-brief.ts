import { briefRequestSchema, validateEvidence, type Patient, type Brief } from './schema';
import { z } from 'zod';
import { patientAtDate, todayInHelsinki } from './record-context';
export const manualRequestSchema = briefRequestSchema.extend({ content: z.unknown() }).strict();
export function verifyManualBrief(input: unknown, patient: Patient): Brief {
  const request = manualRequestSchema.parse(input);
  if (request.patientId !== patient.id) throw new Error('Patient mismatch');
  const asOfDate = request.asOfDate || todayInHelsinki();
  return { ...validateEvidence(request.content, patientAtDate(patient, asOfDate)), patientId: patient.id, role: request.role, visitReason: request.visitReason, asOfDate, mode: 'manual', generatedAt: new Date().toISOString() };
}
