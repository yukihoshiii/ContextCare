# Event work — 13 October 2026

## Organizer materials inspected

Read the protected Dropbox folder inventory and the Veil.AI README and USAGE previews. Passwords and protected sharing URLs are intentionally absent from this document. The folder contains the dataset, preliminary-information forms, a data overview PDF, and `Ratkaisun palautus_pohja (1).pptx`.

Downloaded `LUVN Hackathon.zip` (689,364,109 bytes) without a Dropbox account and safely extracted 227 archive entries into ignored `data/organizer/`. The browser download event timed out, but the local `.crdownload` grew and became a completed ZIP. No organizer records have been imported into the application or transmitted to Intric. Clinical schema field names and the data overview PDF have been inspected. Comprehensive structured-table mapping remains pending.

Local JSONL inspection confirms 1,500 clinical rows and 1,500 social rows in 2024–2026, with exactly 1,500 distinct shared `subject_id` values. Only counts and field names were output; patient text was not printed. The 15 preliminary-information files are survey definitions with questions, categories and scoring configuration, not completed patient responses. Two filenames refer to the same secondary-education form and were compared and are identical JSON objects: there are 14 unique survey definitions.

The supplied PowerPoint contains four template slides: solution description, self-assessment, demo flow and instructions for optional pitch slides. Its solution-description limit is **200 words**, stricter than the 300-word rules summary; prepare a description within 200 words to meet both. Self-assessment is 200 words total, pre-event disclosure five lines, optional pitch slides at most five pages. Template text was inspected through slide XML; visual layout has not been reviewed.

## Dataset selection and mapping

- Use **2024–2026** for ContextCare: clinical and social domains share 15,000 people through `asiakas_id`; 1,500 people have texts in both domains.
- Do not mix cohorts. The 2025 clinical and social populations are separate and cannot be linked to each other. The two cohorts have independent identifiers.
- Read one format per table: Parquet, JSONL and CSV are alternative copies. CSV texts contain quoted newlines and require a CSV parser.
- Clinical text: `subject_id` joins `asiakas.asiakas_id`; `visit_id` joins `kontakti.kontakti_id`. Preserve `visit_date`, `clinician_role` and `note_text` as source provenance.
- Social text: `subject_id` joins the social customer; `decision_id` joins `paatos.paatos_id`. Preserve decision/plan dates and separate `decision_text` from nullable `plan_text`.
- Medication-to-contact joins require `laakitys_kontakti` using `laakitys_avain`. Laboratory-to-contact joins require `laboratorio_kontakti` using `Avain`. Never infer these links by date.
- Social compatibility views repeat core records; do not concatenate them into core tables. `osastohoitojakso` is deliberately empty because this is outpatient data.
- Synthetic counts and rates are modelling assumptions, not LUVN statistics. Social texts are decision/implementation-plan drafts; presentation must preserve draft status.

## Next implementation steps

1. Obtain the local files under ignored `data/organizer/`; inspect schema guides and preliminary forms before choosing the final import mapping.
2. Validate IDs and joins locally, keeping cohort and source IDs explicit. Check duplicate keys and unmatched links rather than silently dropping rows.
3. Build a local adapter for the selected cohort. Preserve original text for exact evidence verification and avoid invented patient age or visit purpose.
4. Keep organizer-origin external generation blocked until permitted processing destinations are confirmed. New Intric administrator rights do not establish permission to transfer this dataset.
5. Inspect the supplied slide template and disclose the pre-event prototype in the submission.

## Onsite announcement

The supplied screenshot lists Tuesday briefing at 10:45, lunch at 12:00, first review at 15:00, daily wrap-up at 16:00 and networking at 17:00. Use the current onsite schedule over earlier estimates. Guides contain submission materials; Hackerpack contains partner-tool setup instructions.

Verified assistant creation access and created a dedicated ContextCare draft with one-day conversation retention. The authored Emma test returned three facts and three gaps with valid exact citations. UpToDate login succeeded; its search-page restriction precludes importing content into AI. See [configuration and limitations](intric/dedicated-assistant.md). Credentials remain outside source and documentation. Intric API credentials/endpoint remain unavailable.

## Local import implemented

`npm run data:import:veil -- data/organizer/Hackathon_data/LUVN_synteettinenData_VEIL/2024-2026 data/veil-2024-2026.sqlite` created a private SQLite database with 1,500 patients and 3,512 text sources. The CLI rejects existing destinations, duplicate source IDs, unmatched/cross-patient joins, date mismatches and incomplete plans; errors omit source content. This first adapter imports clinical text and social decision/plan text, not medications, labs or every structured contact.

Synthetic display names replace source identifiers in names. Age is computed at the newest imported source date and that date is displayed; visit purpose is left empty for the user to provide. Clinical/social source text is retained unchanged. Dataset origin is stored in database metadata and drives the external-provider restriction and manual-prompt visibility. Unknown origins fail closed. The sidebar displays a 30-patient sample to limit the initial page payload; the database retains all 1,500.

Local `.env.local` selects the organizer database. Tests: 29 passed in the full suite plus one targeted database-origin test; production build passed. The targeted test confirms DATA_ORIGIN=self-authored cannot override organizer metadata and no HTTP request is made. This is a local prototype with no deployed authorization system. Deterministic generation selects source excerpts and does not infer clinical gaps for imported patients.

Preparation-date filtering now excludes future sources from deterministic generation and manual evidence verification, while leaving them in the original timeline. Default date is today in Helsinki. Empty historical contexts fail clearly. UI verification confirmed the first patient’s 15 October decision is excluded on 13 October.

## Full dataset expansion

Imported and activated `data/veil-full.sqlite`: 45,000 profiles and 1,089,966 source records. This supersedes the initial 1,500-patient text-only database. All three populations are isolated by cohort/domain namespace; clinical/social data for 2025 are not linked. Added structured clinical sources and social core sources plus planned home-care rows, with explicit provenance and conservative interpretation notices. Compatibility views are not appended. Search and pagination now cover the full database. The materials page exposes 14 blank form definitions read-only, not patient responses or scoring. See [coverage](DATA-COVERAGE.md).

Validation for the expanded adapter: 34 tests passed, including cross-patient medication links, exact laboratory decimals/units, population isolation, empty social histories and planned-service ownership. Build passed. Browser verification confirmed 45,000 total profiles, 15,000 matches in the linked population, page 2, and three population-isolated matches for profile number 15,000. Its local doctor excerpts covered medication, laboratory result, recorded diagnosis and procedure; the medication source dialog retained table/key provenance and documentation-interval warning.

## Clinician-readable source preview

Replaced raw note prefixes with complete-sentence excerpts from presenting context, recorded findings, reported risks and recorded plan. Each displayed excerpt retains exact evidence. Smart brief uses separate paragraphs and bold labels; technical field names and duplicate source buttons are absent. Clinical source documents render headings and paragraphs safely without executing Markdown/HTML. Regular medication-use code is displayed in plain language, and duplicate diagnosis code fields are omitted. Verified the user's displayed first patient in the browser. 38 tests and build passed. This remains source-based extraction, not semantic AI analysis.

## Automatic preparation and AI review

Automatic preparation is enabled with a 700 ms debounce after valid visit-context changes. One active context is maintained; identical concurrent requests share a call, context changes abort previous requests, and revision guards prevent stale output. Request cancellation propagates to the optional gateway with a timeout. No patient responses are cached. Browser checks confirmed generation without clicking the button and refresh after changing professional role.

The user is awaiting the organizer's Intric API reply and prefers Intric over installing a local model. No local runtime was installed. A fictional nurse injection trial passed schema/citation checks but revealed historical/current wording and completion-presuming questions. A reviewed correction addressed both, and persistent assistant instructions were updated and verified. This distinguishes source fidelity from semantic correctness.

Submission draft prepared at `docs/SUBMISSION-DRAFT.md`: description 185 words, assessment 171 words, five-line pre-event disclosure and four-minute demo outline. Nothing submitted.


## Intric API unavailable — replacement prepared

The user reports that Intric will not provide API access. Selected a direct Mistral EU chat-completions adapter and prepared a fixtures-only development command. The adapter separates trusted instructions from JSON input, excludes unnecessary identity fields, disables tools, bounds request/response sizes, rejects incomplete responses and validates exact patient-source quotations. Organizer/unknown data still fails closed. No keys were configured, accounts created, funds spent or live Mistral requests made. Five mocked-transport tests were added; all 48 tests and the production build passed. Model quality and Finnish-language usefulness remain untested. See [setup and remaining requirements](AI-REPLACEMENT.md).


## Intric key provisioned and Swedish Hosted configured

After explicit user confirmation covering replacement of any old key, generated a personal Intric API key through My account / Profile / API keys. Stored it only in the ignored `.env.local` as INTRIC_API_KEY, with file permissions 0600. No Organisation pages were opened. Changed only the ContextCare assistant completion model to Swedish Hosted - Managed by Intric and saved the change. Its model detail lists google/gemma-4-31B-it hosted in Sweden by Intric. The saved assistant retains transcription/images Off and a one-day retention policy. API calls and application integration are not yet verified. Earlier intermediate UI showed default model/retention values while loading; final saved settings are the authoritative state.


## Live Intric integration

Verified the hosted OpenAPI and personal api-key authentication with a GET of our assistant only. Implemented fixed assistant/model checks and patient-isolated POST sessions, bounded bodies, cancellation, 90-second timeout, source validation and provenance. Live doctor and nurse fixture trials succeeded in the browser with automatic generation and evidence navigation. No organization endpoints or organizer records were used. All 52 tests and the production build passed. The UI now names Intric Swedish Hosted for verified live responses. Full-dataset activation awaits confirmation of permitted Intric processing.


## Organizer-approved AI and doctor feedback — 13 October

The user confirmed organizer permission for processing the delivered Veil database through Intric Swedish Hosted. Activated AI_PROVIDER=intric on the full database, with a narrow database/profile guard and unchanged blocks for other destinations. Each request verifies the pinned assistant/model, then creates a new session. The database is not uploaded wholesale.

Read the supplied doctor interview and secondary AI summary. Implemented complaint-prioritized bounded source selection (100 records / 90 kB), prior-care-first doctor instructions and timeline text search. Coverage is disclosed. Gaps are labelled as not established in selected sources. Medication documentation interval fields remain in original records but are omitted from model input after a trial revealed misleading use-date interpretation. Age metadata referenced after the preparation date is also omitted from AI input.

Live browser generation on an organizer linked profile with 1,349 records succeeded, selecting 100 of 1,250 eligible records. The brief found April 2024 knee examination/care, dated context and questions. Opening the cited note displayed the original Finnish record with readable headings. This is functional evidence, not clinical validation. Interview findings and implementation boundaries are recorded in CLINICIAN-FEEDBACK.md; submission prose is updated in English. No Organisation endpoints or UI were used.

Validation after these changes: all 57 tests passed and the production build passed. Live brief and source navigation were checked in the browser. Screenshot is kept only in ignored local data/organizer-ai-brief.png.


## Source-linked questions before the visit — 13 October

Added a separate Questions before the visit card, generated in the same Intric request as the brief. It displays up to five patient-facing questions, current visit purpose, dated rationale and clickable original sources. Questions can follow up existing care and relevant chronic conditions rather than only missing fields. Historical plans, medication use/purpose and outcomes must be confirmed rather than assumed. Optional schema support keeps older manual/demo output readable; new Intric responses must include questions. Question evidence is validated for exact quotation, patient ownership and preparation date.

Read interview 2: the interviewee identifies himself as a medical physicist, not a doctor. Incorporated task-specific relevance and human verification into the prompt; no MRI clearance or new provider integration is implemented. Did not transmit either interview document. Updated only our assistant's persistent prompt through its documented endpoint, preserving Swedish Hosted and checked configuration; no Organisation endpoint was used.

A first browser attempt was rejected by verification and not displayed. A subsequent live API trial returned three source-linked questions and passed validation. All 60 tests and the production build passed, including invalid/cross-patient/future question sources and output bounds. Further expert review of question relevance remains necessary.

Final browser trial succeeded with four patient-facing questions (symptom change, exercise follow-up, current pain-management use and daily mobility). The exercise question opened the original dated plan and highlighted its quotation. Several live attempts were rejected; safe development diagnostics identified invalid evidence. No raw provider text, keys or record content are logged. Reliability remains limited: rejected outputs require retry and successful citations do not validate semantic reasoning. Screenshot is kept locally in ignored data/pre-visit-questions.png.


## Empty-evidence failure fixed — first patient / knee pain

Terminal showed two rejected requests with too_small at facts[0].evidence. The user identified the first patient and reason knee pain. Source inspection found no knee/polv mentions in its 26 original records; 24 records are eligible by 13 October. Strengthened instructions to avoid turning the visit reason or missing matching history into an unsourced fact. Added one bounded new-session correction attempt for JSON/schema/citation/question failures, with approved-configuration rechecks and shared timeout/cancellation. No failed draft is sent back or displayed, no source check is weakened. A second invalid result now produces a specific user-facing validation error.

The same user scenario succeeded live in the browser: 24/24 dated records, four sourced context/medication facts, two preparation questions and a missing-prior-knee-care item. No previous knee treatment was invented. Saved local screenshot data/knee-pain-fixed.png. All 64 tests and build passed, including retry limit, rejection of fabricated evidence, changed assistant setup and cancellation. This improves recovery; model output can still fail verification or contain semantic errors requiring professional review.


## Readable timeline, gap-first questions and themes

Questions now place the existing missing/unclear-information prompts first, with explicit explanations of what is not established. Sourced follow-up questions distinguish documented history from unknown current status. Doctor prompt prioritizes complaint-specific gaps rather than unrelated administrative/social outcomes. Requested fuller briefs with grouped medication/topic context and 4–8 useful facts when evidence supports them; no minimum length is forced on sparse records. Updated the dedicated assistant instructions and preserved Swedish Hosted configuration.

Timeline now uses the same labelled-paragraph renderer as Smart Brief, with source previews and batches of 30 records. Structured source drawers display readable labels and explicit unknown values; original fields and provenance remain expandable. Social assessment dates are recorded dates, not proof of completion. Added a regression test for null support flags and assessment completion wording.

Added light/dark theme with saved preference and system default. Browser verified switching and persistence on reload. Processing/configuration banners, technical patient IDs and redundant marketing chrome were removed from the main flow or moved to disclosure controls. Professional-review and synthetic-data context remain available. Full brief/source/gap wording still requires expert evaluation.

Project-readiness visualization prepared with implemented/review/pending work, next steps, challenge 1.1 fit and submission limits from reviewed materials. No completion percentage, clinical validation or measured benefit is claimed. English presentation deck, rehearsal, permission-boundary explanation and final Junction submission remain unfinished. All 65 tests passed; production build passed.

Final live knee-pain check returned gap-first previous-care questions plus onset/course, functional impact and unconfirmed current medication use; no unrelated social-assessment question was included. Citation checks passed. Theme persistence was verified across reload.


## Card dashboard visual refresh

Applied the supplied card-layout reference: rounded surfaces, compact patient directory, broad Smart Brief and right-hand Missing pieces, with questions/timeline in the next row on wide screens. Visit identity/context controls are grouped in a separate card. Accent is #93a9e2; dark card surfaces #303030; light background #f5f5f5. Text/controls retain contrast through separate foreground tokens. Narrow screens stack cards; small role and generation controls occupy full rows. Browser checked 1440px desktop and 390px/320px layouts without document overflow, plus both themes. Saved local screenshots data/card-dashboard-dark.png and data/card-dashboard-light.png. AI/data behaviour was not changed by this visual update. Production build passed.


## Minimalist interface cleanup

Removed Data & AI details and its processing banner completely, plus the welcome headline, repeated card subtitles, empty-state slogans, duplicate sidebar/profile labels and repeated card footers. The patient name is the page heading; concise visit/date/role controls and source statuses remain. Removed only the approval-display prop and UI computation; Intric transmission/configuration guards remain in the server adapter. Build passed. Browser confirmed the deleted text is absent and the core controls remain. Saved local proof data/minimal-workspace.png.


## Sidebar and card placement update

Swapped Timeline and Questions in both DOM order and responsive grid placement. Removed the overview header so the patient context card starts at the top. Theme control now sits at the bottom of the sidebar. Pagination is above the patient list, with accent-filled arrow links and disabled unavailable directions; the redundant match total was removed. Reserved scrollbar gutter and extra right padding to keep patient cards clear. Production build and structural checks passed. Browser verification could not run because the browser tool rejected reconnecting to the existing preview tab under its URL policy; no workaround was attempted.


## Theme flash and card widths fixed

Saved/system theme is resolved by a static synchronous head script before body rendering; the theme control reads the existing root attribute after hydration and no longer changes a default light theme during mount. HTML root suppresses only the expected theme-attribute hydration difference. Tests cover saved preferences, OS fallback, blocked storage and invalid values; served HTML confirms the script precedes the body. Timeline now spans two desktop columns and Questions uses one; medium screens also give Timeline the wider column. All 68 tests and production build passed. Local dev server was restarted for the verification.

### UI follow-up: initial theme and independent lower cards

- Persist the selected theme in a one-year SameSite=Lax cookie as well as local storage. The root layout reads the cookie and emits the theme in server HTML before JavaScript; the early bootstrap migrates older local-storage preferences and respects the server choice.
- Give the upper and lower card rows separate grids: the lower timeline/questions ratio is 1.6:1, independent of the upper brief/missing ratio. Both rows stack on narrow screens.
- Group timeline search label, field and result count in one consistently padded block; remove inherited prototype-note margins.
- Validation: 70 tests passed; production build passed. Local HTTP checks for both dark and light cookies confirmed root attributes, synchronous head bootstrap and updated layout markup. Browser visual/reload checks remain unavailable because the browser tool previously rejected access under its URL policy.
