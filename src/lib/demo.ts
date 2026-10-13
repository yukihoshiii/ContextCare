import { type BriefContent, type Patient, type Role } from './schema';
import { summarizeSource } from './source-summary';
export function demoBrief(patient: Patient, role: Role): BriefContent {
  const ranked = [...patient.records].sort((a, b) => {
    const priority = (type: string) => role === 'social-worker' ? (type === 'social' ? 2 : 0) : role === 'nurse' ? (type === 'measurement' || type === 'visit' ? 2 : 0) : (type === 'medication' || type === 'visit' ? 2 : 0);
    const sourcePriority = (record: Patient['records'][number]) => {
      if (!patient.datasetDomain) return priority(record.type);
      if (!record.sourceTable) return (role === 'social-worker' ? record.type === 'social' : record.type === 'visit') ? 5 : 2;
      if (record.sourceTable.endsWith('/kontakti') || record.sourceTable.endsWith('/ajanvaraus')) return -1;
      if (record.type === 'medication') return role === 'doctor' ? 4 : role === 'nurse' ? 3 : 0;
      if (record.type === 'measurement') return role === 'nurse' ? 4 : role === 'doctor' ? 3 : 0;
      if (record.type === 'social') return role === 'social-worker' ? 4 : 1;
      return priority(record.type);
    };
    return sourcePriority(b) - sourcePriority(a) || b.date.localeCompare(a.date);
  });
  const usedTables = new Set<string>();
  const selected = ranked.filter(record => {
    if (!record.sourceTable) return true;
    if (usedTables.has(record.sourceTable)) return false;
    usedTables.add(record.sourceTable); return true;
  });
  const facts = selected.slice(0, 4).map(summarizeSource);
  const missingByPatient: Record<string, BriefContent['missing']> = {
    P001: [
      { title: 'Recent blood pressure readings', status: 'not-found', explanation: 'No readings appear in the available records. This does not establish that measurements were never taken.', question: 'Do you have recent home blood pressure measurements?' },
      { title: 'Exact symptom onset', status: 'unclear', explanation: 'Dizziness is documented; the exact onset is not recorded. Timing alone does not establish a medication-related cause.', question: 'When did the dizziness first begin?' },
    ],
    P002: [{ title: 'Physiotherapy follow-up', status: 'unclear', explanation: 'Physiotherapy was recommended, but attendance is not confirmed in the available records.', question: 'Have you been able to attend physiotherapy?' }],
    P003: [{ title: 'Follow-up laboratory results', status: 'not-found', explanation: 'Tests were requested; no results appear in the available records.', question: 'Were the requested tests completed?' }, { title: 'Current medication list', status: 'not-found', explanation: 'The care coordination call does not document current medicines.', question: 'Which medicines are you currently taking?' }],
  };
  const socialMissing = { title: 'Support assessment outcome', status: 'not-found' as const, explanation: 'An assessment or follow-up is mentioned, but its outcome is not present in these records.', question: 'What support is currently in place, and what remains difficult?' };
  return { facts, missing: role === 'social-worker' && missingByPatient[patient.id] ? [socialMissing] : missingByPatient[patient.id] || [] };
}
