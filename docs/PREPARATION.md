# Pre-event preparation

Date: 12 October 2026 (Europe/Helsinki).

Created before the hackathon:

- Next.js/TypeScript foundation and custom responsive patient workspace.
- Three fictional patients authored for demonstration (not organizer data).
- Role-based deterministic demo brief, manually authored information gaps and timeline filters.
- Source-record viewer with exact quote highlighting.
- Domain schemas, evidence validation, server generation endpoint and basic request guards.
- Optional SQLite fixture persistence and HTTPS AI gateway contract/adapter.
- Integration/safety documentation and focused validation tests.

Not yet completed: organizer dataset import, organizer DB/AI connection, UpToDate integration, authenticated authorization and clinical validation. Real integrations require the organizer emails.

Record work completed during the event separately for submission disclosure.

## Follow-up preparation on 12 October

Added general-purpose canonical JSONL/CSV validation tooling, unique-ID checks, safe validation errors, explicit dataset-origin outbound gate and focused tests. Reviewed public rules and challenge descriptions; see EVENT-REQUIREMENTS.md.

Correction to the earlier plan: rules distinguish general preparation from event-targeted solution work. The existing patient workspace and deterministic challenge demo were already created before this review and must be fully declared as the starting point. Targeted work performed during the event must be documented separately. Disclosure does not guarantee eligibility; ask an organizer to confirm the acceptable use of this starting prototype.

Prepared an unapplied Intric assistant configuration/instructions draft before the event. Account inspection found no creation control; no assistant was created. This draft is part of the pre-event starting state, not event-created work.

Before the event, ran one Intric browser trial on four self-authored fictional records using the shared assistant; retained the prompt and verified JSON result. This is part of pre-event preparation and must be disclosed with the starting state.

Added a manual pasted-JSON bridge into the patient workspace before the event. It validates source quotes on the server and displays explicit manual provenance. This targeted feature is part of the pre-event starting state and must be declared alongside the existing prototype. Browser verification used only the earlier fictional trial output.

Added generated request/schema tooling and performed an agent-driven browser trial for fictional P002/Nurse. First model output was rejected for a concatenated quote; an explicitly requested revision was validated and displayed. Added HTTP and live-output regression tests, corrected duplicate React keys. This pre-event targeted preparation belongs to the disclosed starting state. No permanent Intric API automation or shared-assistant settings changes were completed.
