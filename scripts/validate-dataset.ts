import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'csv-parse';
import { DatasetValidator, DatasetValidationError } from '../src/lib/import-validation';
const MAX_FILE_BYTES = 1024 * 1024 * 1024;
const MAX_ROW_BYTES = 2 * 1024 * 1024;
const MAX_PATIENTS = 50000;
const allowedOrigins = ['self-authored', 'organizer'];
async function main() {
  const [inputPath, origin, ...extra] = process.argv.slice(2);
  if (!inputPath || !allowedOrigins.includes(origin) || extra.length) throw new Error('Usage: npm run data:validate -- /absolute/file.jsonl self-authored|organizer (or .csv)');
  const path = resolve(inputPath);
  const info = await stat(path);
  if (!info.isFile() || info.size > MAX_FILE_BYTES) throw new Error('Expected a regular file no larger than 1 GiB.');
  const validator = new DatasetValidator();
  let row = 0;
  const consume = (value: unknown) => {
    if (++row > MAX_PATIENTS) throw new Error('Dataset exceeds 50,000 patients.');
    validator.validate(value, row);
  };
  if (path.endsWith('.jsonl')) {
    const stream = createReadStream(path, { encoding: 'utf8' });
    let buffer = '';
    const consumeLine = (line: string) => {
      if (!line.trim()) return;
      if (Buffer.byteLength(line) > MAX_ROW_BYTES) throw new Error('JSONL row exceeds 2 MiB.');
      let value: unknown;
      try { value = JSON.parse(line.replace(/^\uFEFF/, '')); } catch { throw new Error(`Invalid JSON at patient row ${row + 1}.`); }
      consume(value);
    };
    try {
      for await (const chunk of stream) {
        buffer += chunk;
        let newline: number;
        while ((newline = buffer.indexOf('\n')) !== -1) {
          consumeLine(buffer.slice(0, newline)); buffer = buffer.slice(newline + 1);
        }
        if (Buffer.byteLength(buffer) > MAX_ROW_BYTES) throw new Error('JSONL row exceeds 2 MiB.');
      }
      consumeLine(buffer);
    } finally { stream.destroy(); }
  } else if (path.endsWith('.csv')) {
    // Canonical interchange: one patient per row; records is a quoted JSON array.
    const stream = createReadStream(path);
    const parser = stream.pipe(parse({ columns: true, bom: true, skip_empty_lines: true, max_record_size: MAX_ROW_BYTES }));
    try {
      for await (const raw of parser) {
        const value = { ...raw, age: Number(raw.age) };
        try { value.records = JSON.parse(raw.records); } catch { throw new Error(`Invalid records JSON at patient row ${row + 1}.`); }
        consume(value);
      }
    } finally { parser.destroy(); stream.destroy(); }
  } else throw new Error('Supported canonical formats: .jsonl and .csv. Organizer-specific field mapping and Parquet conversion are not implemented yet.');
  if (!validator.patients) throw new Error('Dataset is empty.');
  console.log(JSON.stringify({ valid: true, patients: validator.patients, records: validator.records, origin, persisted: false, externalTransmission: false }));
}
main().catch(error => {
  // CSV parser errors may include original field values: never print raw errors.
  const safe = error instanceof DatasetValidationError || (error instanceof Error && /^(Usage:|Expected |Dataset |JSONL |Invalid JSON |Invalid records JSON |Supported canonical)/.test(error.message));
  console.error(safe ? error.message : 'Dataset could not be validated. Check the file, CSV syntax and canonical schema.');
  process.exitCode = 1;
});
