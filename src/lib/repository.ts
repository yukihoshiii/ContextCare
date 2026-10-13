import 'server-only';
import { patients } from './fixtures';
import { patientSchema, type Patient } from './schema';
import type { DataOrigin } from './data-policy';
export interface PatientRepository { origin: DataOrigin | undefined; list(query?: string, offset?: number): Promise<Patient[]>; count(query?: string): Promise<number>; get(id: string): Promise<Patient | undefined> }
const fixtureRepository: PatientRepository = { origin: 'self-authored', async list(query = '', offset = 0) { return patients.filter(p => `${p.name} ${p.id}`.toLowerCase().includes(query.toLowerCase())).slice(offset, offset + 30); }, async count(query = '') { return patients.filter(p => `${p.name} ${p.id}`.toLowerCase().includes(query.toLowerCase())).length; }, async get(id) { return patients.find(p => p.id === id); } };
let repository: PatientRepository | undefined;
export async function getRepository(): Promise<PatientRepository> {
  if (repository) return repository;
  if (process.env.PATIENT_STORE !== 'sqlite') return fixtureRepository;
  const { DatabaseSync } = await import('node:sqlite');
  const { mkdir } = await import('node:fs/promises');
  const { dirname, resolve } = await import('node:path');
  const path = resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH || './data/contextcare.sqlite');
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY,value TEXT NOT NULL)');
  const insert = db.prepare('INSERT OR IGNORE INTO patients (id,payload) VALUES (?,?)');
  if (Number(db.prepare('SELECT COUNT(*) AS count FROM patients').get()!.count) === 0) {
    for (const patient of patients) insert.run(patient.id, JSON.stringify(patient));
    db.prepare('INSERT OR REPLACE INTO metadata VALUES (?,?)').run('origin', 'self-authored');
  }
  db.exec("CREATE TABLE IF NOT EXISTS patient_directory (id TEXT PRIMARY KEY, name TEXT NOT NULL)");
  if (Number(db.prepare('SELECT COUNT(*) AS count FROM patient_directory').get()!.count) === 0) db.exec("INSERT INTO patient_directory SELECT id, json_extract(payload,'$.name') FROM patients");
  const storedOrigin = db.prepare("SELECT value FROM metadata WHERE key = 'origin'").get()?.value;
  const origin = storedOrigin === 'organizer' || storedOrigin === 'self-authored' ? storedOrigin : undefined;
  repository = {
    origin,
    async list(query = '', offset = 0) { return db.prepare("SELECT p.payload FROM patient_directory d JOIN patients p ON p.id=d.id WHERE instr(lower(d.id || ' ' || d.name), lower(?)) > 0 ORDER BY d.id LIMIT 30 OFFSET ?").all(query, offset).map(row => patientSchema.parse(JSON.parse(String(row.payload)))); },
    async count(query = '') { return Number(db.prepare("SELECT count(*) AS count FROM patient_directory WHERE instr(lower(id || ' ' || name), lower(?)) > 0").get(query)!.count); },
    async get(id) { const row = db.prepare('SELECT payload FROM patients WHERE id = ?').get(id); return row ? patientSchema.parse(JSON.parse(String(row.payload))) : undefined; },
  };
  return repository;
}
