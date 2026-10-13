# Intric replacement — 13 October 2026

The user reports that Intric will not provide API access. The browser assistant remains a historical trial; automated generation no longer depends on getting an Intric key.

## Account access blocker

The user supplied a Mistral Studio screenshot showing “Upgrade to use your API keys” and a disabled New key button on the Free plan. Free API key creation is unavailable in this account. Do not describe this path as a confirmed free option or ask the user to upgrade without an explicit spending decision. The adapter remains prepared but inactive. Groq documents a Free API tier; account-specific key creation, model availability and data permissions still need verification before selecting it.

## Prepared path

Use the direct Mistral chat-completions API at the fixed EU endpoint. The adapter is implemented, but **no API key is configured and no live Mistral evaluation has occurred**. This is a connectivity choice, not a finding that Mistral produces clinically reliable Finnish summaries.

- [API contract](https://docs.mistral.ai/api/endpoint/chat): stateless chat completions, JSON mode and bearer authentication.
- [Regional inference](https://docs.mistral.ai/inference/regional-inference): EU endpoint controls eligible inference geography, not all account/control-plane metadata. Regional pricing has an additional charge; check current pricing before adding funds.
- [Zero data retention](https://docs.mistral.ai/admin/monitor-comply/zero-data-retention): requires an approved request on an eligible paid organization; it is **not automatically enabled by this adapter**. Training preferences are a separate control.

Copilot SDK is a possible fallback for a development demo, but embeds a CLI agent runtime and introduces tool, identity and context isolation concerns. Bedrock is a viable deployment option if an approved AWS account, model permissions, region and budget are provided. Neither is activated. Local-model installation remains unrequested and was previously declined.

## Live test setup

1. Create/sign in to [Mistral Studio](https://console.mistral.ai/) and obtain an API key. Do not paste the key into chat or commit it.
2. Add `MISTRAL_API_KEY` and `MISTRAL_MODEL` to the existing ignored `.env.local`. Do not replace that file: it contains the organizer-store configuration. Select a model available to your account on the EU endpoint; `mistral-medium-latest` is an initial documented candidate, not a verified account entitlement.
3. Run `npm run dev:ai` on macOS/Linux and open `http://127.0.0.1:3001`. This command explicitly selects the three self-authored fictional fixtures and Mistral, preserving the organizer database. Run separately from the other development server; Next may prevent two dev servers sharing a build directory, so stop the first server if it reports a lock.
4. Check doctor, nurse and social-worker outputs, historical dates, contradictions, pending assessments, Finnish language fidelity and injected instructions. Validate exact citations and review whether each assertion follows from its evidence. Assess usefulness with a professional before making performance claims.

Without explicit `AI_PROVIDER`, the existing gateway setting continues to work, or source preview remains the default. Missing Mistral credentials cause a clear configuration error; failures never substitute source preview and label it AI.

## Data boundary

All direct Mistral calls require repository origin `self-authored`. Organizer and unknown origins are rejected before HTTP transmission. No new environment override exists to bypass this. Removing names is useful minimization but does not authorize third-party processing of organizer records. Processing the supplied database through any cloud model remains dependent on organizer permission and reviewed destination/retention settings.

The adapter sends a fresh two-message request for each visit context, with separate system instructions and JSON input. It excludes patient names, initials, appointments and record authors from its structured fields; free-text source content is not automatically de-identified. No tools, file uploads or persistent conversation API are used. Requests are limited to 120 kB; larger histories fail rather than silently dropping sources. Response bodies are limited to 64 kB, truncated/tool responses fail, source ownership and exact quotes are validated. Timeout is 25 seconds, cancellation is forwarded, redirects are rejected and raw provider errors are not logged or returned.

Automated tests use mocked HTTP responses. They establish adapter behavior, not model quality, resistance to all prompt injection, provider-side deletion or clinical safety.
