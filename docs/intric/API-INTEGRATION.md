# Intric API integration — 13 October 2026

## Verified contract

Read the hosted public OpenAPI schema at https://api.intric.ai/openapi.json. Personal keys use the `api-key` header. The pinned ContextCare assistant is `1e51e102-deb0-4ede-8c71-9a9115cb3ab5`.

GET `/api/v1/assistants/{id}/` verifies the exact assistant/model and configuration. POST `/api/v1/assistants/{id}/sessions/` with `{question, stream:false, files:[]}` creates a fresh conversation. No prior session ID is supplied. The returned `answer` contains the JSON brief. The response's model ID is checked against Swedish Hosted `42716f71-907d-4cb8-9db9-e3fc66330348`. Model metadata confirms `google/gemma-4-31B-it`, provider Intric, hosting `se`.

No Organization endpoints are used. The personal key remains in ignored `.env.local` with mode 0600. The adapter uses a fixed endpoint and assistant, rejects redirects, bounds requests to 120 kB and response envelopes to 192 kB and answers to 64 kB, applies a 90-second total timeout and forwards cancellation. It checks tools/shared knowledge are empty, logging is off and assistant retention is one day before sending any patient context. Provider-side retention/deletion is not independently audited.

Every request contains one selected patient's permitted-date records, professional role, reason and cutoff date. Names, initials, appointment text and record authors are excluded as fields. Free text is not automatically de-identified. Exact citation validation does not establish that every interpretation or missing-information claim is correct.

## Live result

The authored Emma doctor trial succeeded in 6.22 seconds with three facts and three gaps, all source quotations valid. Saved as `swedish-api-trial.json`. Automatic preparation in the browser also succeeded and the source dialog opened the cited original record. These are limited functional trials, not clinical validation.

Run `npm run dev:ai` for Intric on three authored fixtures at http://127.0.0.1:3001. The normal `.env.local` continues to select the full local organizer database. On 13 October the user explicitly confirmed organizer permission to process the delivered Veil database through Intric Swedish Hosted. The normal workspace now uses this route. The approval guard allows only the delivered database path and its three profile namespaces; unknown origins, other organizer databases and other external providers remain blocked.


## Organizer workflow and interview changes

The local database retains 45,000 profiles and 1,089,966 source records; it is not uploaded wholesale. After the preparation-date cutoff, each request selects at most 100 records within a 90 kB source budget, prioritizing complaint terms, limited Finnish equivalents, role and recency. Selection can miss relevant information; the UI discloses selected/eligible counts. It is lexical selection, not semantic retrieval over the entire database.

A live browser trial on a linked profile with 1,349 records analysed 100 of 1,250 records available by 13 October. It returned previous knee examination/care from April 2024, comorbidity, dated medication documentation with unconfirmed current use, lifestyle and clarification questions. Exact source validation passed. The trial does not establish clinical correctness. An earlier trial confused medication documentation interval endpoints with use; those interval fields are now withheld from model input while preserved in the original source viewer.

Doctor priorities now follow the onsite interview: previous care for the same complaint, then useful medication/comorbidity/lifestyle context. Timeline search covers original text, authors and source table names. Real hospital, occupational-health and private-provider systems are not connected. Nurse/social-worker requirements need their own expert review. See [clinician feedback](../CLINICIAN-FEEDBACK.md).


## Pre-visit question output

The current JSON contract adds an optional `questions` array for legacy compatibility; new Intric responses must include one to five entries. Each entry contains `title`, `question`, `rationale` and non-empty exact `evidence`. Questions and facts share the same patient-owned, preparation-date source checks. The model is instructed to link questions to the current complaint/task, confirm whether historical plans were followed, and avoid assumed adherence, causation, current medication use or procedure clearance. Questions are generated in the existing request, not by an additional background call.

Live browser verification returned four source-linked questions and opened the cited original exercise plan. Some attempts were rejected for invalid evidence; no relaxed citation matching was introduced. Development diagnostics log only error categories or schema paths/codes. Model output reliability and clinical wording remain limitations, and a rejected generation can require retry.


## Invalid-draft correction

A user request for the first linked patient / knee pain returned facts[0].evidence=[] and was correctly rejected. The instructions now explicitly distinguish the visit reason from source-record findings and keep claims of missing matching history in missing, rather than in unsourced facts. Invalid JSON/schema/quotes or missing preparation questions trigger one new patient-isolated attempt using the same selected input and concise validation feedback. The invalid answer itself is not transmitted or displayed. Every attempt rechecks the approved model/configuration. Both attempts share the 90-second timeout and cancellation signal. Network/model/configuration/external-content failures are not retried by this correction path. A second invalid draft gives a specific verification error; there is no demo substitution or relaxed citation matching.
