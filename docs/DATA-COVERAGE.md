# Connected organizer data — 13 October 2026

The supplied emails estimated approximately 50,000 profiles. The delivered dataset contains **45,000 synthetic profiles** in independent populations. These are fictional profiles, not real patients. The active local database is `data/veil-full.sqlite`, excluded from Git and classified as organizer data.

| Population | Profiles | Imported source records | Cross-domain linkage |
|---|---:|---:|---|
| 2024–2026 linked | 15,000 | 868,001 | Clinical and social share the same people |
| 2025 clinical | 15,000 | 171,985 | Separate clinical population |
| 2025 social | 15,000 | 49,980 | Separate social population |
| Total | 45,000 | 1,089,966 | Never link the two 2025 populations |

Source-record counts represent separate documents/table rows, not distinct visits. An appointment, contact, diagnosis and medication can concern the same encounter. All source IDs include cohort/domain namespace, preventing collisions between unrelated populations.

## Included sources

- Clinical: customer demographics for display age, contacts, appointment records, diagnoses, procedures, medications, laboratory results, clinical note text.
- Social: customer ownership, contacts, referrals, assessments, decisions, services, housing periods, planned home-care service rows, decision/implementation-plan draft text.
- Medication and laboratory link tables validate ownership through contact IDs; never approximate their relationship from dates.
- Planned home-care rows join through the unique synthetic person key in the corresponding social customer population. That person key is omitted from rendered source content.
- Structured field values are explicitly identified as structured sources and retain table/key/contact provenance. Original prose is retained separately, unchanged. Laboratory decimal strings and unit information remain strings.
- Compatibility views (`kotihoito_kontakti`, `kotihoito_paatos`, `palvelutarpeen_arviointi`) repeat core records and are not appended. The inpatient table is empty by design.
- Inactive social profiles retain an empty history; no artificial event is created. For a profile without dated records, display age uses an explicitly shown end-of-cohort reference date.

## Materials

`/materials` provides population selection links, a read-only catalogue of 14 unique preliminary-information form definitions (15 files, one exact duplicate), partner-tool links and submission limits. JSON item counts include explanatory fields and are not the number of scored clinical questions. Patient responses and scoring are not implemented. The supplied PowerPoint and data overview PDF remain local under `data/organizer/`.

## Verification and boundaries

Full database import succeeded with ownership, unique-key and source-date validation. All 45,000 profiles have directory entries. Search is parameterized and uses the lightweight directory; histories are fetched for a page of 30 profiles. UI verification found a profile numbered 15,000 and confirmed page 2 and population filtering. Sources after the preparation date remain excluded from brief generation and manual evidence validation.

This remains a local prototype without deployment-grade authentication or professional authorization. Role selection changes presentation priorities, not permissions. Local output is deterministic source selection, not an AI clinical interpretation. Intric API integration and permitted processing of organizer data remain unconfirmed; external transfer stays blocked.
