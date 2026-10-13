# ContextCare

A patient-preparation workspace built for the SOTE AI Hackathon. It brings relevant records, information gaps and suggested questions into one view before an appointment.

- Smart brief tailored to the professional role and visit reason.
- Questions that help clarify missing information and follow up previous care.
- Searchable patient timeline with links to original sources.
- Responsive interface with light and dark themes.

## Getting started

Requires Node.js 22.13+ and npm.

```sh
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). Choose a patient, role and visit reason to explore the workspace.

A fresh checkout uses three self-authored fictional patients and a source-based demo mode. Live AI generation uses Intric Swedish Hosted and requires local server-side configuration. Copy `.env.example` to `.env.local` and follow the [Intric setup guide](docs/intric/API-INTEGRATION.md).

## Development

```sh
npm test
npm run build
```

## Data and limitations

API keys and the restricted organizer dataset are excluded from this repository. AI drafts require professional review; source checks do not establish clinical correctness. This prototype has no production authentication or patient-access controls.

See [project status](docs/PROJECT-STATUS.md) and [data coverage](docs/DATA-COVERAGE.md) for details.
