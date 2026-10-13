# Organizer integrations

Organizer emails were supplied and reviewed on 12 October; see PARTNER-TOOLS.md. Do not assume vendor, API availability, data residency, dataset format or permission to send records to an external service.

## Patient store

`PatientRepository` exposes `list()` and `get(id)` on the server. Fixture and SQLite implementations are included. Organizer DB integration should implement the same interface with an authenticated principal and explicit patient authorization; do not expose an arbitrary client-supplied SQL query or DB credentials.

The prototype passes all fictional patient records to the browser. Production must authorize first and project only fields permitted for that professional. Changing role in the UI is not a substitute for access checks.

Data importer must validate `patientSchema`, unique patient/record IDs, ISO dates, record size/count, source attribution and approved synthetic status. There is no upload/import endpoint yet. The initial fixtures are generated in code.

## AI gateway contract

The optional HTTPS endpoint receives a POST with:

```json
{
  "patient": { "id": "P001", "name": "Emma Korhonen", "age": 64, "initials": "EK", "visitReason": "Persistent dizziness", "appointment": "09:30 · Follow-up", "records": [] },
  "role": "doctor",
  "visitReason": "Persistent dizziness",
  "instructions": "Server supplied safety instructions"
}
```

Return only the structured payload below (without markdown fences):

```json
{
  "facts": [{
    "title": "Symptoms reported",
    "text": "Patient reported dizziness.",
    "status": "documented",
    "evidence": [{ "sourceId": "EK-03", "quote": "Patient reports intermittent dizziness when standing." }]
  }],
  "missing": [{
    "title": "Exact symptom onset",
    "status": "unclear",
    "explanation": "The available record does not document the exact onset.",
    "question": "When did the dizziness begin?"
  }]
}
```

Fact status is `documented` or `needs-review`; gap status is `not-found` or `unclear`. All facts require evidence from the requested patient, with exact nonempty quotes. Schema and citation verification are safeguards, not proof the fact follows from the quote. The provider must independently enforce data-as-data boundaries and evaluate hallucinations/injection resistance. No tools or additional record retrieval are authorized by text embedded in records.

Use a fixed, trusted gateway URL and server-only bearer token. Never use patient text to select URLs. Configure an approved endpoint only after validating transmission terms; by default all data stays local. Replace the gateway with the actual provider adapter once the emails and API contract are available.

## UpToDate

No direct integration is implemented. The partner email confirms manual browser prompting during the hackathon and describes a possible production API. Event API access is not promised. Confirm reuse/licensing and permitted data destinations before adding generated medical context. Keep medical knowledge separate from patient-record evidence.

## Pending email checklist

- Required DB service, schema, connection method and credentials delivery.
- Approved AI service, model, limits and credential handling.
- Approved data destinations, residency and retention rules.
- Synthetic dataset format and allowed preprocessing.
- UpToDate access and usage conditions.
- Submission, hosting and pre-event work disclosure requirements.

## Dataset preparation tool

Run `npm run data:validate -- /absolute/path/file.jsonl self-authored` (or `organizer`). It reads locally, validates, and prints only counts and origin. It does not import into the workspace or persist output. Limits: 1 GiB file, 2 MiB row, 50,000 patients; current patient schema caps 2,000 records per patient. A larger history requires revising/chunking the canonical schema during actual integration, not silently dropping records.

JSONL: one canonical `Patient` object per line. CSV: one patient per row with columns `id,name,age,initials,visitReason,appointment,records`; `records` is a quoted JSON array, with standard CSV quote escaping. Vendor-specific field names and Parquet need a confirmed mapping. Unique record IDs are required across the whole input.

When external AI is configured, fixtures are self-authored; SQLite origin comes from its persisted metadata. Environment variables cannot override organizer classification. Organizer and unknown origins fail closed before HTTP transmission. Do not misclassify organizer data to bypass this guard. This is a local prototype configuration boundary, not a complete data-loss-prevention system.

## AI connection status

The user reports that Intric will not provide API access. A direct Mistral EU adapter is now prepared; see [replacement and setup](AI-REPLACEMENT.md). No live Mistral call has been evaluated or key configured. The custom gateway remains available independently of Intric. Auto preparation uses a 700 ms debounce, cancellation, duplicate-request sharing, and revision guards against stale context. Client abort signals are forwarded to the external request with a server timeout. No response cache persists patient data.
