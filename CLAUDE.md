# Signal Workshop

Travis Dater's personal project site. Authoritative brief: `docs/project-brief.md`; reread the
relevant section before each milestone. Status and evidence: `docs/requirements-checklist.md`.

- Astro 7 static site (`src/`), Cloudflare Pages Functions + D1 (`functions/`, `migrations/`).
- Content is YAML/Markdown in `src/content/`, validated by `src/content.config.ts`. Templates and
  workflow: `docs/content-workflow.md`. Never hand-edit `functions/_lib/project-ids.ts`.
- Before claiming done: `npm run check && npm run lint && npm run build && npm test && npm run test:e2e`.
- Boundaries: no deploys, DNS, spending, repo visibility changes or publishing new binaries
  without Travis's approval. Never link source repos, never publish location/email, never offer
  `.aab`, never call a build signed/safe without evidence. `internal:` fields never ship.
- Public copy is welcoming with dry humour. Chat with Travis can be crude; site copy can't.
