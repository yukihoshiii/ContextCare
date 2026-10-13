# ContextCare — submission draft

Not submitted. Figures describe the local prototype, not clinical outcomes. Recheck current Junction fields and onsite instructions before submitting.

## Solution description (under 200 words)

ContextCare prepares a source-linked patient overview for a healthcare or social-care professional before an appointment. The professional selects the patient, perspective, visit purpose and preparation date. Context changes automatically refresh the preview; later-dated records are excluded.

The local prototype connects 45,000 synthetic profiles and 1,089,966 source records from the supplied Veil.AI dataset. Earlier event communications estimated approximately 50,000 profiles. It keeps the three supplied populations separate and links health and social data only where the dataset explicitly supports it.

Clinical notes appear as readable excerpts for presenting context, findings, reported risks and recorded plans. Structured medication, laboratory, diagnosis and social-service fields retain their source identifiers. Each fact and suggested pre-visit question links to its source.

Intric Swedish Hosted now generates briefs from the organizer-approved dataset, selecting a bounded set of dated records for each patient and complaint. Exact quotations are validated before display. An onsite doctor interview informed the focus on previous care for the same complaint, medication, comorbidities and available lifestyle context. This is formative feedback, not clinical validation. The application does not diagnose or prescribe. Real hospital, occupational-health and private-provider systems are not connected.

## Self-assessment (under 200 words)

Impact: The workflow brings relevant records and their sources into one preparation view. Expected time savings and better conversations are hypotheses; no clinical or time-saving outcome has been measured.

Feasibility: The prototype imports the actual synthetic delivery, validates patient ownership and supports search across 45,000 profiles. Live production integrations, authentication and professional authorization remain future work.

AI: A dedicated Intric assistant was tested on authored fictional records. JSON schema and exact citation checks reject unsupported source references. Live Intric API generation uses Swedish Hosted on authored fixtures. Organizer processing is now approved and enabled only through the pinned Swedish Hosted assistant. Deterministic previews are labelled separately.

Responsibility: The database remains local; selected patient records are sent only through the approved Intric route. Origin is persisted; other external destinations remain blocked. Future records are excluded from the selected preparation date. Historical medications and plans are not presented as confirmed current treatment or completed care. Human review remains necessary.

Innovation: The prototype combines role/context preparation with checkable source references across explicitly linked health and social data. It distinguishes unestablished information from confirmed absence and preserves uncertainty. It is an early implementation rather than a validated clinical system.

## Starting-state disclosure (five lines)

Before the event we built a targeted Next.js patient-preparation UI using three authored fictional patients.
We implemented deterministic role-based previews, a fixture/SQLite repository and bounded API validation.
We prepared exact-source citation checks, a manual Intric response workflow and tests.
We reviewed event/partner documentation and tested the existing shared Intric assistant on fictional examples.
Organizer-data mapping, full import, the dedicated assistant and onsite workflow changes were developed at the event.

## Four-minute demonstration outline

- 0:00–0:35: Professional preparing for a visit; why context and traceability matter.
- 0:35–1:35: Select the linked population, patient and perspective. Enter purpose/date; show automatic preparation and readable excerpts.
- 1:35–2:20: Open a source. Show exact evidence, structured field provenance and exclusion of later records.
- 2:20–3:10: Show a live organizer-data knee brief, previous care and citation validation. Explain selected-record coverage and the doctor interview.
- 3:10–4:00: Explain boundaries, evaluation plan and path to authorized source-system/model integration.

## Evidence to gather before submission

Ask professionals to assess relevance, omitted important information, misleading interpretations and readability. Use an agreed fictional/synthetic test set and record failures as well as successes. Measure preparation time only with a defined comparison and report sample size. Live organizer-data AI has been demonstrated. Do not claim production readiness, clinical validation, complete-history coverage or measured benefit.
