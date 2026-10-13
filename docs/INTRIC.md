# Intric documentation review — 12 October 2026

## Confirmed from public documentation

An assistant is created inside a Space; it inherits the Space's security classification, affecting available models/tools. Creation steps: Basics, Instructions, Knowledge, AI Setup. [Create an assistant](https://help.intric.ai/en/docs/assistants/create-assistant/).

Assistant messages, history and attachments reach Intric. Prompt/instructions and relevant context can reach the selected model provider. Intric states its model-provider contracts require zero retention and no training. This is distinct from Intric's own conversation storage. [Assistant data flow](https://help.intric.ai/en/docs/security-compliance/data-flows/llm/).

Conversation retention is configurable in days; an empty field means no automatic deletion. Organization policy may impose a maximum. [Retention](https://help.intric.ai/en/docs/assistants/create-assistant/data/).

A custom MCP connection requires tenant module availability, admin permissions and publicly reachable HTTPS by default. Authentication supports API key or OAuth. Tools must be enabled and capabilities have Off/Ask/Auto modes. This lets Intric call our tools; it does not establish an endpoint for our Next.js server to invoke an Intric assistant. [MCP setup](https://help.intric.ai/en/docs/tools-and-integrations/mcp-server/connecting-your-own-mcp-server/).

Available models and integrations must be checked in the tenant portal; public technical documentation directs readers there. [Technical documentation](https://help.intric.ai/en/docs/technical-documentation/).

## Integration decisions for this project

- Preserve the Next.js UI and server provider abstraction.
- No verified assistant-invocation API contract was found in the reviewed Help Center pages. Do not configure AI_GATEWAY_URL to a guessed Intric URL: it currently expects our custom JSON contract, not the Intric API.
- Obtain the hackathon tenant's supported API/SDK/OpenAPI reference, base URL, authentication, assistant IDs, response format, session lifecycle, quotas and permitted processing destinations from the partner. No credentials or live requests have been used in this review.
- If programmatic access is unavailable, use a clearly identified manual browser workflow for the demonstration. Native widgets are a separate product/UI integration and do not automatically produce our validated brief schema.
- Avoid a shared Knowledge collection containing all patients. A future integration should supply only the authorized patient's selected records and never reuse conversation history across patients.
- Keep tools/web search disconnected for the brief assistant unless a narrowly scoped need is approved. This is our design choice, not a claim that Intric enforces it by default.
- Keep medical reference output separate from original patient evidence.
- Configure and verify retention and deletion with the tenant administrator; provider zero retention does not imply no history in Intric.
- The organizer/unclassified outbound gate stays in place. Public security claims do not prove the event tenant/model is an approved destination for the organizer dataset.

## Partner questions

1. Can our server invoke an assistant through an API in this tenant? Please provide the current contract and supported auth method.
2. Which model/processing region is approved for the event data, and is sending organizer records explicitly permitted?
3. Can every brief use an isolated session? Is there structured JSON output support?
4. How are conversation history, uploaded files and derived data removed after the event?
5. What permissions, quotas and access expiry apply to the team?

## Account inspection — 12 October 2026

Signed in through the portal using credentials supplied by the user; no credentials were copied into project files. Read-only account inspection found:

- Space: `Sote AI Hackaton`; label `Public`; security classification `Julkinen` (`Julkinen tieto`). These labels do not prove anonymous Internet access or permission to upload organizer data.
- One assistant in the visible list: `sparrikaveri dev to prod`, published. No create/edit/admin/API-key control was visible in the inspected sections; this is not proof such permissions or APIs do not exist elsewhere.
- Assistant completion model: `Claude 4.5 Sonnet`, exact model name `claude-sonnet-4-5`; model detail dialog lists provider/sub-processor `Anthropic` and hosting region `United States`.
- Attached capabilities: Tilastokeskus, Duodecim, Sotkanet, Finlex (custom MCP servers). Tools were not called.
- Assistant data retention: `No automatic deletion`.
- No prompts or patient data were sent; no assistant, model, retention, membership or integration settings were changed. The welcome tour was dismissed for navigation.
- The integrations page failed with `Part of the app didn't load`; its retry then showed `Intric could not start / The app could not load your account`. Further API/access inspection could not be completed in this browser session.

Implication: the currently visible assistant is a shared development helper, not a verified patient-brief runtime configuration. Before integration obtain the assistant API contract and ability to create a separate assistant, verify the approved model/processing region and retention, and clarify event data permission. Existing organizer-data outbound block remains appropriate. The current model details contradict any assumption that all inference in this tenant necessarily remains in Europe.

## Follow-up account inspection

Portal loaded successfully on retry. In both All spaces and Sote AI Hackaton, Assistants had no Create control. The existing assistant's Actions menu offered only Details. Space Members listed an administrator but did not list this account as a direct member; this does not rule out group/public access. Integrations showed `Your organisation does not have any integrations enabled.` This does not negate the MCP capabilities shown on the existing assistant; they may be represented separately.

No assistant was created and no permissions/configuration were changed. The account appears to have browsing/use access in the inspected surfaces, without exposed creation controls. Administrator verification of organization role and Creator access is required. A local, unapplied setup draft is saved in `docs/intric/assistant-setup.md`. No API key was generated or retrieved.

## Live browser trial — authored synthetic example

At the user's explicit request, sent a single software-format prompt to the existing assistant in a new conversation. Only four fictional Emma Korhonen records (EK-02–EK-05), role doctor, and the reason persistent dizziness were supplied. No organizer dataset or real patient data was transmitted. Shared assistant configuration was not edited.

The returned payload contained 3 facts and 3 gaps. It passed the application's `validateEvidence` schema and all 3 quotes were exact substrings of the supplied sources. Manual review found no diagnosis, prescribing or medication causation claim in this output. Role relevance is not perfect: one fact concerns living alone, while the documented transport difficulty is omitted. Passing this example is not a clinical validation or proof of future reliability/injection resistance.

Artifacts: `trial-prompt.txt`, `trial-response.json`, `trial-result.png`. Conversation: https://portal.intric.ai/8de0e1a0-0692-41de-a3cd-67e7f7a58c94/d8dad5e6-a872-4e23-840a-50ebdd6d1131

This confirms a manual prompt → structured JSON → local evidence-verification workflow. It does not establish API access or an automatic application integration. No tool invocation was visible in the captured response; tool use is not disabled by an enforced assistant configuration. Retention remains the existing assistant's no-automatic-deletion setting.
