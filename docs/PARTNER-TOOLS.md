# Partner tools — supplied email chronology reviewed 12 October 2026

Source: user-supplied mail.txt. This is a summary of supplied messages, not verification of current account access. No credentials, verification codes, private registration details or invitation tokens are copied here.

## Later messages clarify earlier offers

- Participation: a later Junction message confirms the user's place. The early message about a teammate's missing registration is historical; current teammate registration and team/project creation still need checking in Junction. Guide contains the Q&A summary.
- UpToDate Expert AI: the partner confirms the team selected it. Hackathon usage is manual prompting in the browser. A production API exists according to the partner, but event API credentials/access are not promised. Separate credentials email is expected; validity is seven days after sending. Trial prompting beforehand is explicitly offered. Specify the intended audience in every prompt.
- GitHub Copilot: later email provides access to a temporary event environment and GitHub AI Credits. Use it as coding assistance, not as the application's runtime AI service. Environment and permissions disappear after the event; keep the main repository in a durable team-owned environment. The actual access URL is absent from the pasted text.
- AWS Kiro: offered on site as a coding environment, with access/support from the AWS team. This does not establish AWS hosting, database or Bedrock credits.
- Intric: invitation followed by an account-provisioning message. The partner describes a platform for sovereign AI/open models and controlled organizational knowledge. Current login, actual model selection, hosting/data-processing terms and programmatic access remain unverified. Invitation and guide URLs are absent from the pasted text.
- Tieto Campus: initial offer is a test environment based on LUVN source systems; access is subject to Tieto's decision. No access-grant or DB connection message appears in the supplied chronology. Do not assume a provided SQL database.
- Avrea: initially offered AI-assisted CI/CD for GitHub Actions. No confirmed activation or technical details in the supplied messages.

## Implementation plan

1. Keep the existing application and repository interface. Local SQLite remains the optional development store until a confirmed Tieto/data interface is available.
2. Treat Intric as a candidate runtime AI service. Obtain the actual API contract (if available), permitted models and approved data-processing destinations from the partner. Build the provider adapter during the event, rather than inventing an endpoint from the marketing description.
3. Treat UpToDate as a separate medical-knowledge layer. During the event, prepare a manual workflow: audience + clinical question → browser query → professional review → clearly attributed medical context. Do not label that output as an original patient fact, invent patient-record source IDs for it, or present a manual step as automatic API integration.
4. Maintain the organizer-data outbound block. Partner availability does not by itself grant an exemption from organizer data restrictions. Clarify whether the provided Intric tenant and UpToDate are approved processing destinations for the organizer dataset before transmitting records. Until then, use only our authored examples when trying external tools.
5. Copilot/Kiro are development assistants. Keep dataset files and secrets out of repository uploads and prompts to coding assistants. Do not infer runtime AI authorization from coding-tool access.
6. Record actual activation, limits, expiry and processing permission after the credentials and partner guidance are available. Account setup and accepting invitations are separate user actions; reading these emails does not authorize submitting personal information or granting access.

## Next practical checks

- Junction: teammate registered, leader-created team joined, Guide accessible.
- UpToDate: separate credentials received and still active; clarify permitted dataset use.
- Intric: invitation active, login completed, API/assistant access and approved processing confirmed.
- Tieto: determine whether the team requested and received access; identify dataset schema/interface.
- Keep pre-event work disclosure current; event-targeted implementation remains event work.

Public Help Center reviewed: see [Intric technical findings](INTRIC.md). Assistant creation, Space classification, model-provider flows and retention are documented. The actual assistant invocation API and event-tenant access remain pending; MCP tool connectivity is a different direction of integration.
