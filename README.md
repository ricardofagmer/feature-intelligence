# Feature Intelligence System

An AI-first feature-request system for product teams. Instead of a voting board with an
AI button bolted on, **every request passes through an AI triage pipeline before a human
ever looks at it** — duplicates are consolidated, the underlying customer problem is
extracted, requests are grouped into themes and scored against the team's business goals,
and product leaders get generated decision briefs per theme. PMs stop reading raw queues
and start reviewing AI conclusions.

Full product/technical spec: [docs/specs/feature-intelligence-spec.md](docs/specs/feature-intelligence-spec.md)
AI collaboration log: [prompts.txt](prompts.txt)

## Quick start

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run seed                 # realistic demo corpus (16 requests, themes, votes, review queue)
npm run dev                  # http://localhost:3000
```

Without an API key the app still runs: submissions are stored as `pending_triage` and can
be re-triaged later — the product degrades honestly, it never blocks on the AI.

## What it does

| Surface | What happens |
|---|---|
| **Board** (`/`) | Submit a request; AI triages it in-flight (~5-10s). Browse with search, status filter, and priority/support sorting. Each card shows the AI's read of the *underlying need* next to the user's own words. |
| **Request detail** | Original text vs. AI interpretation, duplicate/related links with confidence, priority score with written rationale, support. |
| **Themes** (`/themes`) | Emergent AI-proposed groupings with aggregate demand. One click generates a **decision brief** for product leaders: problem, evidence, options, recommendation. |
| **Review queue** (`/review`) | The human-judgment surface. Mid-confidence duplicate merges and new-theme proposals wait here for PM approve/reject. High-confidence duplicates auto-merge; low-confidence noise is dropped. |

## The AI pipeline

On every submission, one structured Claude call (model: `claude-sonnet-5-5`, tool-use
structured output, zod-validated with one error-carrying retry) performs four stages
over FTS5-retrieved candidates:

1. **Understand** — extract the underlying problem (job-to-be-done), persona, product area.
2. **Deduplicate** — judge each lexical candidate `duplicate | related | distinct` with
   calibrated confidence. ≥0.85 auto-merges (support consolidates onto the canonical
   request); 0.60–0.85 goes to the human review queue; below is ignored.
3. **Theme** — assign an existing theme or propose a new one (new themes require PM confirmation).
4. **Prioritize** — 0–100 score against configured business goals (`src/lib/config.ts`)
   with a written rationale. Advisory, never auto-executing.

Decision briefs are a second, on-demand generation grounded strictly in stored evidence.

### Why this architecture

- **Single structured call, not an agent loop** — triage is a deterministic DAG, not an
  open-ended task. One call with retrieved context is cheaper, faster, and evaluable.
  Agentic synthesis is reserved for briefs, where selection/synthesis actually helps.
- **FTS5 + LLM judgment instead of embeddings** — Anthropic exposes no embedding API; at
  this corpus scale a lexical prefilter plus LLM verdicts beats cosine thresholds on
  precision, with one less vendor. Revisit at ~50k requests.
- **Confidence-gated autonomy** — the AI acts alone only above a precision threshold;
  everything in the ambiguous band is routed to humans. False merges destroy requester
  trust, so the irreversible-feeling action is gated.
- **LLM output is untrusted input** — every response is schema-validated (zod) with one
  error-carrying retry, then a typed failure. User text is delimited as data in prompts
  (injection hygiene). Unknown candidate IDs from the model are dropped.
- **Observability built in** — every call logs model, prompt version, latency, tokens,
  outcome to `ai_calls`. Prompts are versioned constants. The review queue's
  approve/reject verdicts are the future golden set for prompt evals.

### Where human judgment remains

Approving mid-confidence merges, confirming new themes, final prioritization and roadmap
decisions, and anything customer-facing. AI proposes; humans decide.

## Success metrics

1. **Triage time per request** — manual ~5–10 min → <30 s AI + review only for the ~20%
   that hits the queue (measured: `triaged_at − created_at`, queue dwell time).
2. **Duplicate consolidation precision** — AI merge proposals approved vs. rejected in the
   review queue; target ≥95% precision on auto-merges.
3. **Time-to-decision / stakeholder visibility** — median days from submission to a
   published status (planned/declined/shipped) and % of requests with one.

## Stack

Next.js 15 (App Router) · TypeScript (strict) · SQLite via better-sqlite3 (FTS5) ·
Anthropic TypeScript SDK · zod · Tailwind CSS v4. Monolith by design — one process,
zero infra to run the demo.

```
src/
  app/            pages + API route handlers (thin: validate -> service -> respond)
  components/     UI
  lib/
    types.ts      frozen domain + API contracts
    config.ts     business goals, confidence thresholds, model
    db/           schema (SQL) + connection
    server/       services + repositories (all SQL parameterized)
    ai/           schema.ts (zod I/O contract), prompts (versioned), triage, briefs
scripts/seed.ts   demo corpus
```

## Assumptions, tradeoffs, production gaps

- **No auth / single team** — demo scope. Production needs authn/z and per-tenant
  isolation before real customer data enters the corpus; voter identity is a local name.
- **Synchronous triage on submit** trades a few seconds of latency for pipeline
  simplicity; the `pending_triage` state + retriage endpoint are the seam where a queue
  would slot in.
- **No eval harness yet** (accepted gap): the `ai_calls` log and review-queue verdicts are
  designed to become the golden set; first production step is 30–50 labeled dedupe/theme
  cases run on every prompt change.
- Priority scores are explainable and advisory — the system never auto-declines or
  auto-commits roadmap items.
