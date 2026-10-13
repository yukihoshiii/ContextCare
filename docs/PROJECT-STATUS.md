# ContextCare — readiness review, 13 October 2026

The core local prototype works. Submission readiness is incomplete; no completion percentage or clinical performance claim is justified.

## Evidence checked in this review

- Read current source code, interview implementation notes, submission draft and event work log.
- Read the official challenge PDF and downloaded/read the official rules v3 dated 7 October. Junction-specific announcements/fields were not inspected in this review.
- Read-only SQLite query: 45,000 profiles, 1,089,966 source records, persisted organizer origin. Active local configuration selects SQLite and Intric; secret-file mode is 0600. No secrets were printed.
- Latest verification, immediately preceding this review: 70 tests and production build passed; dark/light cookie requests returned correct server HTML. No additional live AI trial or browser visual check was performed in this review.

## Challenge 1.1 alignment

| Requirement | Current evidence | Remaining gap |
|---|---|---|
| Relevant role/task preparation | Role, complaint and date drive bounded record selection and AI prompt. | Expert evaluation of relevance and omissions; nurse/social-worker views lack their own validation. |
| Multiple sources and forms | Linked synthetic health/social delivery, readable structured fields and source provenance. | Explain modeled source-system boundaries in the demo; no production source systems are connected. |
| Information prepared without unnecessary searching | Auto-refresh with debounce, cancellation and request deduplication after context changes. | Appointment context is entered manually; no scheduling-triggered preparation. |
| Relevant and permitted information | Approved Swedish Hosted route, origin guard, patient/date quote validation. | UI role is presentation only; authenticated patient/field authorization is absent. |
| Professional remains decision maker | Source-linked drafts, gaps and suggested questions; no diagnosis/prescribing. | Exact quotations do not establish semantic correctness. |

Real source-system integrations are explicitly outside the event implementation scope. The timeline supports preparation; it should not displace the main challenge with a contact-management workflow.

## Ready

- Full delivered synthetic database with isolated cohorts, search and pagination.
- Intric API adapter pinned to the approved Swedish Hosted model and dedicated assistant; fresh sessions and checked configuration.
- Smart brief, gap-first suggested questions, dated timeline and original source navigation.
- Date cutoff, schema/ownership/exact-quotation checks and one bounded correction attempt.
- Responsive card UI, light/dark preference including server-rendered theme.
- Doctor and medical-physicist interview feedback incorporated; interviews are formative feedback, not clinical validation.
- English submission description, self-assessment, starting-state disclosure and four-minute demo outline drafted.

## Remaining work, in priority order

1. Evaluate a small explicit demo set against originals: relevant existing complaint history; no matching complaint history; a long history; missing/unclear medication status. Record successes, failures, omissions and generation time. Ask a doctor to review relevance/wording; report actual sample size.
2. Prepare a deterministic rehearsal route and an event-permitted backup demonstration. Do not expose organizer rows in publicly shared materials. A live API failure must remain visible, without an unlabeled demo fallback.
3. Finish presentation material (optional, at most five pages) and rehearse the four-minute pitch. Include modeled integrations, role/access distinction, AI coverage limits and event starting state.
4. Update contradictory historical wording in the submission self-assessment and recheck actual Junction fields, team/solution name, challenge, word/line limits and current onsite instructions. Submit before the deadline; submission has not occurred.
5. Arrange post-event deletion of supplied data and derived copies, including imported databases, extracted delivery, organizer screenshots/outputs and provider-side retained event records as applicable. This review does not delete any data.

## Rules and judging implications

Deadline: 14 October 2026, 13:45, Junction. Description at most 300 words, self-assessment at most 200, mandatory starting state at most five lines; demo or recording required; slides optional at most five pages; pitch four minutes.

Weights: impact 30%, feasibility 25%, AI 15%, responsibility 15%, innovation 15%. The biggest evidence gap is measured/professionally reviewed usefulness, followed by demo reliability and an explicit permission-boundary explanation. No scores are predicted.

Prior work must be accurately disclosed; assessment concerns event work relative to that starting state. The current disclosure documents the pre-event targeted prototype. No organizer confirmation of its acceptability is recorded.

Rules permit an English pitch but recommend Finnish written submission/slides to reduce misunderstanding. The user requested English; retain English and consider a short Finnish explanation if helpful.

## Sources

- [Official rules v3](https://admin.luvn.fi/sites/default/files/2026-10/SOTE%20AI%20Hackathon%202026_S%C3%A4%C3%A4nn%C3%B6t%20ja%20osallistumisehdot%202.pdf)
- [Official challenge descriptions](https://admin.luvn.fi/sites/default/files/2026-09/LUVN%20Hackathon%20haasteiden%20kuvaukset.pdf)
- Local evidence: EVENT-WORK.md, DATA-COVERAGE.md, CLINICIAN-FEEDBACK.md, SUBMISSION-DRAFT.md, intric/API-INTEGRATION.md and current source code.

Historical notes such as FULL-CHECK.md and PREPARATION.md describe earlier snapshots; they are not current capability lists.
