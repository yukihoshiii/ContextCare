# Intric API handoff

Dedicated assistant: `1e51e102-deb0-4ede-8c71-9a9115cb3ab5` in Space `particulartell`.

Programmatic access is now established: personal key created, hosted OpenAPI checked, Swedish Hosted verified and live fictional trials passed. See [current integration](API-INTEGRATION.md). The checklist below records the original handoff questions. The user also confirmed approval for the delivered Veil database through Intric Swedish Hosted on 13 October; the current integration represents that narrow scope.

## Required organizer information

1. Exact hosted API base URL and documentation/version for calling this assistant.
2. Authentication type and secure credential delivery; allowed assistant/Space scope, expiry and quota.
3. Endpoint, request body, response shape and how to start a fresh patient-isolated session.
4. Whether structured JSON/schema output is supported; streaming, size and timeout limits.
5. Explicit permission for the supplied organizer dataset, approved model/region and retention/deletion terms. A grant of Creator or Space Admin capabilities alone does not supply this permission.

Do not put API keys in chat, source code, frontend environment variables or screenshots. After the authentication format is confirmed, place server credentials in an ignored local environment file.

## Evidence, not a hosted contract

The public [Intric community backend README](https://github.com/inooLabs/intric-community/tree/main/backend) lists configurable `API_PREFIX` and `API_KEY_HEADER_NAME`. Its implementation is a release repository; it does not prove that the current portal tenant uses any particular URL, header or payload. Do not guess these values or repurpose browser session tokens.

The application currently has a custom gateway contract in [INTEGRATIONS.md](../INTEGRATIONS.md). That contract is ours, not Intric's. A verified Intric adapter must translate it to the actual hosted API and validate the returned draft before display.

## Acceptance sequence

- Start with one authored fictional patient and no tools or shared knowledge retrieval.
- Check quota/error/timeout behavior and cancel stale requests.
- Validate bounded JSON and every source ID/exact quotation; reject failures rather than silently substituting a local preview.
- Check patient/session isolation, conflicting historical records and embedded instructions.
- Enable organizer processing only after scope is confirmed and the data-policy implementation explicitly represents that approval.
- Preserve provider/session provenance without logging prompts, secrets or patient content.
