import { z } from 'zod';
export const roleSchema = z.enum(['doctor', 'nurse', 'social-worker']);
export type Role = z.infer<typeof roleSchema>;
export const recordSchema = z.object({
  id: z.string().min(1).max(160), date: z.iso.date(),
  type: z.enum(['visit', 'medication', 'measurement', 'social']),
  title: z.string().min(1).max(200), author: z.string().max(100),
  text: z.string().min(1).max(10000),
  sourceTable: z.string().max(100).optional(), sourceKey: z.string().max(80).optional(), contactId: z.string().max(80).optional(),
}).strict();
export const patientSchema = z.object({
  id: z.string().min(1).max(80), name: z.string().min(1).max(100), age: z.number().int().min(0).max(120).nullable(),
  initials: z.string().max(4), visitReason: z.string().max(500), appointment: z.string().max(80),
  ageAsOfDate: z.iso.date().optional(),
  cohort: z.enum(['2024-2026','2025']).optional(), datasetDomain: z.enum(['linked','clinical','social']).optional(),
  records: z.array(recordSchema).max(2000),
}).strict();
export type Patient = z.infer<typeof patientSchema>;
export type PatientRecord = z.infer<typeof recordSchema>;
export const briefRequestSchema = z.object({ patientId: z.string().min(1).max(80), role: roleSchema, visitReason: z.string().trim().min(3).max(500), asOfDate: z.iso.date().optional() }).strict();
export const evidenceSchema = z.object({ sourceId: z.string().min(1), quote: z.string().min(1).max(1000) }).strict();
export const preparationQuestionSchema = z.object({
  title: z.string().min(1).max(100), question: z.string().min(1).max(250),
  rationale: z.string().min(1).max(400), evidence: z.array(evidenceSchema).min(1).max(5),
}).strict();
export const briefContentSchema = z.object({
  facts: z.array(z.object({ title: z.string().min(1).max(100), text: z.string().min(1).max(600), status: z.enum(['documented', 'needs-review']), evidence: z.array(evidenceSchema).min(1).max(5) }).strict()).min(1).max(12),
  questions: z.array(preparationQuestionSchema).min(1).max(5).optional(),
  missing: z.array(z.object({ title: z.string().min(1).max(150), status: z.enum(['not-found', 'unclear']), explanation: z.string().min(1).max(500), question: z.string().min(1).max(250) }).strict()).max(10),
}).strict();
export type BriefContent = z.infer<typeof briefContentSchema>;
export type Brief = BriefContent & { patientId: string; role: Role; visitReason: string; asOfDate?: string; mode: 'demo' | 'live' | 'manual'; generatedAt: string; provenance?: {provider:'intric';modelId:string;sessionId:string;sourceCount:number;availableSourceCount:number} };
export class EvidenceValidationError extends Error {
  constructor(public readonly reason: 'unknown-source' | 'quote-mismatch', public readonly path: (string | number)[]) {
    super('Invalid evidence');
  }
}
export function validateEvidence(content: unknown, patient: Patient): BriefContent {
  const parsed = briefContentSchema.parse(content);
  for (const group of ['facts','questions'] as const) {
    for (const [itemIndex, item] of (parsed[group] || []).entries()) for (const [evidenceIndex, evidence] of item.evidence.entries()) {
      const record = patient.records.find(r => r.id === evidence.sourceId);
      const path = [group,itemIndex,'evidence',evidenceIndex];
      if (!record) throw new EvidenceValidationError('unknown-source',path);
      if (!record.text.includes(evidence.quote)) throw new EvidenceValidationError('quote-mismatch',path);
    }
  }
  return parsed;
}
