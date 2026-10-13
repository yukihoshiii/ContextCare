import { patientSchema, type Patient } from './schema';
export class DatasetValidationError extends Error {}
export class DatasetValidator {
  private ids = new Set<string>();
  private recordIds = new Set<string>();
  records = 0;
  validate(value: unknown, position: number): Patient {
    const parsed = patientSchema.safeParse(value);
    if (!parsed.success) throw new DatasetValidationError(`Invalid patient schema at row ${position}. No record contents are included in this error.`);
    const patient = parsed.data;
    if (this.ids.has(patient.id)) throw new DatasetValidationError(`Duplicate patient ID at row ${position}.`);
    const localIds = new Set<string>();
    for (const record of patient.records) {
      if (this.recordIds.has(record.id) || localIds.has(record.id)) throw new DatasetValidationError(`Duplicate record ID at row ${position}.`);
      localIds.add(record.id);
    }
    this.ids.add(patient.id);
    for (const id of localIds) this.recordIds.add(id);
    this.records += patient.records.length;
    return patient;
  }
  get patients() { return this.ids.size; }
}
