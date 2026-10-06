# Project Rules

## Prompt Logging

Every time you receive a new instruction or prompt, append it to prompts.txt in the project root with a timestamp (ISO 8601) and a brief summary of what you did in response. Create the file if it doesn't exist. Keep this log updated throughout all sessions.

## Project Facts

- App: Feature Intelligence System — AI-first feature-request triage (Next.js 15 App Router, TypeScript, SQLite, Anthropic API).
- Run: `npm run dev` (requires `ANTHROPIC_API_KEY` in `.env.local` for live AI triage; without it the app runs and queues requests as `pending_triage`).
- Seed demo data: `npm run seed`.
- Verify: `npm run lint && npm run typecheck && npm run build`.
- Specs live in `docs/specs/`; AI pipeline design in `docs/specs/feature-intelligence-spec.md`.
