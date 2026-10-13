import type { Patient } from './schema';
export function todayInHelsinki(): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export class NoContextRecordsError extends Error {}
export function patientAtDate(patient: Patient, asOfDate: string): Patient {
  return { ...patient, records: patient.records.filter(r => r.date <= asOfDate) };
}
