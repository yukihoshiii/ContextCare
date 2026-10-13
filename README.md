# ContextCare

Evidence-linked patient preparation for the SOTE AI Hackathon. This is a local synthetic-data prototype, not a clinical deployment.

## Repository contents

This repository contains application code, documentation and self-authored fictional regression examples. API keys, local configuration, organizer data (including subsets and derived trial artifacts), interviews, screenshots and archives are excluded. A fresh checkout runs with the three authored fictional patients; the full local event dataset is not distributed here. Configure your own permitted server-side credentials locally using `.env.example`.

## Run

Requires Node.js 22.13+ (SQLite support) and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Select a fictional patient, role and visit reason, generate a brief, review source-linked questions before the visit, inspect gaps, filter the timeline and open a cited original record.

```sh
npm run test
npm run typecheck
npm run build
```

## Modes

By default the repository uses three fictional patients and a deterministic demo provider. It selects records by role, copies original text and displays manually authored gaps. The visit reason is captured but does not influence demo analysis. The UI explicitly labels demo output. No external AI calls occur by default.

Copy `.env.example` to `.env.local` to configure optional integrations. Set `PATIENT_STORE=sqlite` to seed and use a local SQLite database. The server-side repository can be replaced with an organizer database adapter. SQLite files are excluded from Git and are not encrypted; use only approved synthetic data.

`AI_GATEWAY_URL` activates a server-side HTTPS gateway conforming to [the integration contract](docs/INTEGRATIONS.md). No provider credentials are embedded in client code. Gateway errors are shown, not silently replaced with demo output. Source IDs and exact quotes are validated; factual entailment and clinical appropriateness still need human review.

**Intric API is connected and tested with Swedish Hosted.** `npm run dev:ai` selects self-authored fixtures on port 3001 with live automatic generation. See [verified contract and data boundaries](docs/intric/API-INTEGRATION.md). The user confirmed organizer permission for the delivered Veil dataset through this assistant/model. The normal local workspace now uses live Intric on that database; other external providers remain blocked. The Mistral adapter is inactive.

## Safety boundaries

- The development and production scripts bind to loopback by default.
- Only fictional data is bundled; no authentication or real patient authorization exists yet.
- Role selection is a presentation preference, not access control.
- Server validates strict request/response schemas, exact evidence quotes and patient ownership of source IDs.
- JSON request bodies are bounded to 4 KiB. A process-local, shared limit allows 20 generation requests per minute; this is not a distributed deployment limiter.
- The gateway has a 25-second timeout and rejects redirects. Raw upstream errors and records are not logged by application code.
- Same-origin browser requests, no-store API responses, frame protections and basic security headers are configured. CSP currently permits inline scripts/styles for Next.js; nonce-based CSP is a deployment follow-up.
- No diagnosis, prescribing, causation inference or external tools are implemented. Record text and visit reason are untrusted inputs; prompt instructions alone do not solve prompt injection.

Before non-synthetic data or public deployment: implement authenticated identities, server-side patient authorization, field-level data minimization, consent/legal review, encryption, audit logging without record contents, managed rate limiting, retention/deletion policies and clinical output evaluation.

## Project map

- `src/lib/schema.ts`: validated domain and brief schemas.
- `src/lib/repository.ts`: fixture and optional SQLite repositories (parameterized queries).
- `src/lib/demo.ts`: deterministic synthetic demonstration.
- `src/lib/provider.ts`: server-side AI gateway adapter.
- `src/app/api/brief/route.ts`: guarded generation endpoint.
- `src/components/workspace.tsx`: patient workspace and evidence viewer.
- `docs/INTEGRATIONS.md`: integration contract and outstanding organizer requirements.
- `docs/PREPARATION.md`: record of work completed before the event.

## Event preparation and data validation

[Verified requirements and remaining questions](docs/EVENT-REQUIREMENTS.md). The existing prototype is part of the pre-event starting state. The organizer-specific solution work should be recorded during the event.

Use `npm run data:validate -- /absolute/path/file.jsonl organizer` for local canonical validation (also supports CSV). No data is uploaded or persisted by this command. The Veil.AI full-dataset adapter is available through `npm run data:import:veil -- /path/to/2024-2026 /path/to/new.sqlite`. It validates text joins and stores organizer origin in database metadata. Raw Parquet import is pending; the JSONL copies cover the supplied structured sources. Organizer/unclassified data is blocked from the optional external AI gateway.

[Partner tool status from supplied emails](docs/PARTNER-TOOLS.md): Intric is the runtime AI candidate; UpToDate is a manual browser knowledge workflow at the event; Copilot/Kiro are coding tools. Tieto DB access is unconfirmed.

## Manual Intric bridge

Open **Use a response from Intric** below the visit controls. Paste only the JSON object from an assistant response for the selected patient and visit context, then choose **Verify and display**. The server verifies the schema and exact source quotations against the selected patient's records. Imported output is labelled **Manual AI import**; the application cannot authenticate which assistant generated pasted text or determine whether every conclusion follows from its quotation.

The verified authored example is `docs/intric/trial-response.json` (Emma / doctor / persistent dizziness). This is a real output from the browser trial, not an automatic API call. Changing patient/role/reason clears the staged response and displayed brief. Errors do not fall back to demo output. Endpoint `/api/brief/verify` bounds request bodies to 64 KiB and returns no-store responses. It makes no external calls and does not persist pasted content.

[Full check and automation boundaries](docs/FULL-CHECK.md). The manual panel now prepares the prompt from current patient/role/visit context. The browser workflow can be executed by the agent during a chat; this is not a background service or permanent API integration.

## Onsite dataset

Local `.env.local` selects `data/veil-full.sqlite`: **45,000 synthetic profiles and 1,089,966 source records**. Earlier communications estimated approximately 50,000. Three populations remain isolated: 15,000 linked clinical/social profiles in 2024–2026, 15,000 clinical profiles in 2025 and 15,000 separate social profiles in 2025. Search and pagination cover the entire database. See [coverage and interpretation](docs/DATA-COVERAGE.md).

Import with `npm run data:import:veil -- /path/to/LUVN_synteettinenData_VEIL /path/to/new.sqlite`. The importer also accepts the `2024-2026` subfolder to import only that linked cohort. Existing database destinations are rejected. Contacts, appointments, diagnosis/procedure rows, medications/labs, social core tables, home-care plans and original text documents are included. Repeated compatibility views are excluded.

Enter a visit reason and preparation date; generated excerpts and manual citation validation exclude sources after that date. Source dates remain visible in the full timeline. Current local output uses Intric Swedish Hosted. A bounded selection prioritizes complaint-related records and displays how many eligible records were analysed. Organizer-origin manual prompts remain hidden; only the approved Intric destination/model is enabled.

Visit `/materials` for read-only form definitions, population links, partner access and submission limits. See [event work](docs/EVENT-WORK.md), [historical Intric trials](docs/intric/dedicated-assistant.md) and [inactive Mistral alternative](docs/AI-REPLACEMENT.md).
