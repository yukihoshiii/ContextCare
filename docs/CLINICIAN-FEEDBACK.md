# Clinician interview → implementation

13 October 2026. Sources: [cleaned interview](../данные/ContextCare_Doctor_Interview_Transcript.md) and [supplied AI summary](../данные/расшифровка.txt). The cleaned transcript is not certified verbatim; the AI summary is secondary interpretation. One interview provides formative feedback, not clinical validation or measured time savings. Neither document was sent to Intric.

## Findings and resulting changes

| Interview finding | Implemented response | Boundary |
| --- | --- | --- |
| Previous examinations and treatment for the same complaint matter before the visit. | Doctor prompt prioritizes **Previous care for this complaint**; context selection looks for complaint terms, including limited Finnish equivalents. | Lexical matching can miss relevant history; bounded coverage is visible. |
| Medication, comorbidities and available smoking/alcohol/weight context can help. | Concise, dated facts with exact source links; medication use remains unconfirmed. | Documentation intervals do not establish actual treatment dates. |
| Searching hospital, occupational-health and private records is difficult, especially without a date. | Timeline search across the supplied records by original text, author and source table. | No live external provider integration or provider identity filter. |
| Social worker information needs differ. | Keep role views; prioritize Doctor Mode for the demo. | Doctor interview does not validate nurse or social worker selections. |
| Privacy and old, slow systems are adoption concerns. | Approved fixed model/destination, server-only key, fresh sessions, bounded patient input and exact evidence checks. | Production authentication, authorization and legacy integration remain future work. |

## Demo narrative (paraphrase)

A doctor preparing for knee pain wants to find what was examined and tried for the same complaint before. ContextCare selects available, dated synthetic records, produces a concise draft and lets the professional open each source. Unavailable provider records and omitted selected-source context remain explicit limitations.

Do not present the above narrative or the supplied summary's quote candidates as verbatim doctor quotations. Do not claim measured benefit, real interoperability, validated role requirements or complete-history AI analysis.

## Next evaluation

Have a doctor assess whether the generated knee brief includes the important previous care and whether any date or medication wording misleads. Compare to the original records and record errors. Validate nurse/social-worker views with those professionals. A timed comparison and larger sample are needed before claiming reduced preparation time.


## Second interview and pre-visit questions

[Interview 2](../данные/ContextCare_Interview_2_Transcript.md) identifies the interviewee as a **medical physicist**, not a medical doctor. The [secondary summary](../данные/расшифровка%202.txt) is interpretation, not independent evidence. His work searching MRI-related implant information supports task-specific relevance and source review. The informal “95 percent” estimate is not validated prevalence; comments about other professions do not validate those role views.

Implemented **Questions before the visit**, a separate card generated with the brief. Intric produces one to five patient-facing prompts with a title, rationale tied to the current visit and exact cited evidence. These can follow up documented care, rather than only fill missing fields. Ask whether care was tried before asking conditionally about outcomes; confirm current medication use instead of assuming historical prescriptions continue. Chronic conditions are included only when relevant to today's context. Procedure-related questions may clarify documented implant details, but the application gives no MRI compatibility determination or clearance.

The API validates question citations using the same patient/date scope as facts, rejecting fabricated or cross-patient evidence. Legacy/manual/demo outputs without questions remain readable and show an explicit empty state; new Intric output must include questions. No extra provider call is needed. The interview files are retained locally and were not transmitted to Intric.

Professional review of question relevance, wording and omitted concerns is still needed. The product presents suggested prompts, not a validated clinical questionnaire.
