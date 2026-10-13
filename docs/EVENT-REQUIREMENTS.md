# Event review — 12 October 2026

[Rules v3, 7 October](https://admin.luvn.fi/sites/default/files/2026-10/SOTE%20AI%20Hackathon%202026_S%C3%A4%C3%A4nn%C3%B6t%20ja%20osallistumisehdot%202.pdf): prepare general tools beforehand; build the targeted solution at the event and disclose prior work. Organizer data is event-only: no redistribution/third-party transfer, delete copies afterwards. No real personal data. Partner tools are optional. Submission: 14 October, 13:45; description ≤300 words, self-assessment ≤200, prior work ≤5 lines, slides ≤5 pages, pitch 4 minutes. Weights: impact 30%, feasibility 25%, AI 15%, responsibility 15%, innovation 15%.

[Challenge 1.1](https://admin.luvn.fi/sites/default/files/2026-09/LUVN%20Hackathon%20haasteiden%20kuvaukset.pdf): purpose-appropriate role/context information, ideally prepared automatically. Model source-system connections; contact-history aggregation belongs to 1.2.

## Our engineering decisions

- Keep the existing prototype in the starting-state disclosure, including its targeted UI and deterministic brief logic. Do not describe it as merely a blank framework.
- Continue generic tooling before the event; record event-specific development separately.
- Dataset origin is explicit. Organizer/unclassified storage is blocked from the external gateway. This application guard does not control files copied into other software; use a local model until permitted processing destinations are clarified.
- Canonical CSV/JSONL validator is ready; actual organizer field mapping and Parquet support remain pending.
- Future timeline should support the evidence for pre-visit preparation rather than grow into an omnichannel contact-management product.
- Future generation should run automatically when an appointment context becomes available, with debounce, cancellation and request deduplication. Implement during the event.
- Professional permissions and presentation priorities should be separate. Model authorization boundaries in the demo and validate them before any deployment.
- Review non-English records, source fidelity, stale/conflicting data and information omission with mentors. Do not claim measured clinical performance from fictional examples.

## Supplied emails reviewed

The user supplied the email chronology on 12 October. See [partner tools](PARTNER-TOOLS.md). UpToDate browser-only hackathon usage is confirmed by the partner email, with a separate credentials message expected. Intric provisioning/invitation and a temporary Copilot environment are described. Tieto Campus access and programmatic Intric access are still unconfirmed. The pasted messages omit invitation/help/access hyperlinks; no account access has been performed. Junction Guide/Q&A remains unread behind sign-in. Partner access is not assumed to override the organizer-data transmission restriction.
