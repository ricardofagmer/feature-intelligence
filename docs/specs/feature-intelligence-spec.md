# Feature Intelligence System — Spec & Design

Status: approved (design gate) · Date: 2026-10-06 · Owner: ricardo.fagmer

## 1. Problem

Product teams drown in unstructured feature requests from customers, sales, and support.
The expensive part is not collecting requests — every voting board does that. The expensive
part is **triage**: spotting duplicates, understanding the real problem behind each ask,
grouping feedback into themes, and prioritizing consistently. Today this is manual,
slow (hours per week of PM time), and inconsistent (depends on who triages).

**Business problem prioritized: triage.** It is the highest-leverage point in the
feature-request lifecycle because every downstream decision (prioritization, roadmap,
stakeholder communication) consumes triage output. Bad triage poisons everything after it.

**Who benefits:** PMs (hours of manual review removed), product leaders (decision briefs
instead of raw lists), requesters (their request lands in the right place and gets a
visible status instead of vanishing into a backlog).

## 2. Solution shape — AI as the triage officer, not a sidebar

Every submitted request passes through an **AI triage pipeline** before humans see it.
AI changes the workflow itself: PMs no longer review a raw queue — they review the AI's
structured conclusions (merge proposals, themes, priority rationale) and only intervene
where confidence is low. The unit of PM work shifts from "read every request" to
"approve/override AI decisions".

Pipeline (one Claude call per stage group, structured output):

1. **Understand** — extract the underlying customer problem (job-to-be-done), affected
   persona, and product area. The stored artifact is the *problem*, not just the ask.
2. **Deduplicate** — candidate retrieval via SQLite FTS5 (lexical prefilter, top 8),
   then Claude judges `duplicate | related | distinct` with confidence per candidate.
   High-confidence duplicates (≥0.85) are auto-linked to the canonical request (support
   is consolidated); mid-confidence goes to a **human review queue**. Never silent-merge
   below threshold.
3. **Theme** — assign to an existing theme or propose a new one (themes are emergent,
   not a fixed taxonomy; new-theme proposals are flagged for PM confirmation).
4. **Prioritize** — score against defined business criteria (demand = supporters incl.
   merged duplicates, strategic fit vs. stated product goals, effort proxy, risk),
   producing a 0–100 score **with written rationale**. Score is advisory: PMs can
   override, and overrides are stored with a reason (feeds future calibration).
5. **Decision brief** (on demand) — per theme, generate a product-leader brief:
   problem statement, evidence (linked requests + supporter counts), options,
   recommendation. Humans make the decision; the status (planned/declined/shipped,
   with rationale) is published back to the board so stakeholders see outcomes.

**Where human judgment stays:** approving mid-confidence merges, confirming new themes,
final prioritization and roadmap decisions, and everything customer-facing. AI proposes;
humans decide anything irreversible or external.

## 3. AI architecture & model choice

- **Model:** `claude-sonnet-5-5` via the Anthropic TypeScript SDK. Triage is a
  structured-reasoning task over short documents — Sonnet-class gives the right
  cost/latency for a per-submission hook; brief generation also uses Sonnet. No
  fine-tuning needed; the leverage is in prompt + context design.
- **Structured output:** tool-use (forced tool choice) with a JSON schema; every model
  response is validated with zod before it crosses into the domain. On validation
  failure: one retry carrying the validation error, then a typed failure
  (`pending_triage` state) — never regex-and-defaults.
- **Why one pipeline call per request (not an agent loop):** triage is a deterministic
  DAG (understand → dedupe → theme → score), not an open-ended task. A single
  structured call with retrieved candidates in context is cheaper, faster, and far
  easier to evaluate than a multi-turn agent. Agentic autonomy is reserved for the
  brief generator, which selects and synthesizes evidence across a theme.
- **Dedupe retrieval is lexical (FTS5), not embeddings:** Anthropic has no embedding
  API, the corpus is small (hundreds–thousands), and FTS5 prefilter + LLM judgment
  gives better precision than cosine threshold alone. Rejected alternative: a separate
  embedding provider — more moving parts, a second vendor, marginal recall gain at this
  scale. Revisit past ~50k requests.
- **Reliability:** max_tokens + timeout + 1 retry w/ backoff on every call; on failure
  the request is stored as `pending_triage` and a background retry endpoint re-runs it —
  the product degrades honestly, never blocks submission on the AI.
- **Observability:** every call logs prompt version, model, latency, token counts,
  outcome (structured JSON line). Prompts are versioned constants (`PROMPT_VERSION`).

## 4. Rejected alternatives

- **Classic voting board + AI summary button:** AI as interface garnish doesn't change
  the workflow; triage stays manual. Rejected — the assessment explicitly asks how AI
  changes the workflow.
- **Fully automatic merging/prioritization with no review queue:** cheaper UX but wrong:
  false merges destroy requester trust and are hard to unwind. Confidence-gated
  automation keeps the human where judgment matters.
- **Multi-agent orchestration (router + specialist agents):** over-engineered for a
  4-stage DAG; adds latency, cost, and eval surface with no quality gain at this scope.

## 5. Scope (this build)

In: submit request, browse/filter requests, support (vote) with dedupe-aware counts,
triage pipeline (auto on submit), themes view, review queue (approve/reject merges &
new themes), decision brief generation, priority board, seed data, graceful no-API-key
mode. Out: auth/multi-tenant (single-team demo; noted as production gap), email/Slack
notifications, embedding search, analytics dashboard.

## 6. Technical design

Monolith-first: **Next.js 15 (App Router) + TypeScript + SQLite (better-sqlite3) +
Anthropic SDK + zod + Tailwind**. One process, zero infra to demo; SQLite gives FTS5
for retrieval. API layer = Next route handlers; domain/data code lives outside routes.

### Data model (frozen contract)

- `requests` (id, title, description, requester, status: `new|triaged|pending_triage|merged|planned|declined|shipped`, problem_statement, persona, product_area, priority_score, priority_rationale, theme_id, canonical_request_id, created_at, triaged_at)
- `request_links` (request_id, related_request_id, kind: `duplicate|related`, confidence, decided_by: `ai|human`)
- `themes` (id, name, summary, status: `confirmed|proposed`, created_at)
- `votes` (id, request_id, voter, created_at; unique(request_id, voter))
- `review_items` (id, kind: `merge|new_theme`, request_id, payload JSON, status: `open|approved|rejected`, created_at, resolved_at)
- `briefs` (id, theme_id, content_md, model, prompt_version, created_at)
- `ai_calls` (id, stage, model, prompt_version, latency_ms, input_tokens, output_tokens, outcome, created_at)
- FTS5 virtual table over requests (title, description, problem_statement)

Effective support for a canonical request = its votes + votes of requests merged into it.

### API (frozen contract)

- `POST /api/requests` {title, description, requester?} → 201 {request} (triage runs synchronously; on AI failure returns request with `pending_triage`)
- `GET /api/requests?status=&theme=&sort=priority|support|new&q=` → {requests: RequestWithMeta[]}
- `GET /api/requests/:id` → {request, links, theme, voters}
- `POST /api/requests/:id/votes` {voter} → {supportCount} (409 on duplicate voter)
- `POST /api/requests/:id/retriage` → re-run pipeline (for pending_triage)
- `GET /api/themes` → {themes: ThemeWithStats[]}
- `GET /api/review` → {items}; `POST /api/review/:id` {action: approve|reject} → applies merge/theme
- `POST /api/themes/:id/brief` → 201 {brief}; `GET /api/themes/:id/brief` → latest
- Errors: `{ statusCode, code, message }`, stable codes: `invalid_request|not_found|conflict|ai_unavailable|internal`.

### UI

- `/` Request board: list w/ support counts, theme chips, priority badges, status filter, sort, search; submit form (modal/inline). Four states handled (loading/error/empty/success).
- `/requests/[id]` Detail: problem statement vs. original ask, duplicates/related, votes, triage rationale.
- `/themes` Themes with aggregate demand; per-theme: generate/view decision brief.
- `/review` Human review queue: approve/reject AI merge + new-theme proposals.

## 7. Success metrics

1. **Triage time per request:** manual baseline ~5–10 min → < 30 s AI + seconds of review for the ~20% that hit the queue. Measured: `triaged_at - created_at` + review-queue dwell time.
2. **Duplicate consolidation rate:** % of incoming requests auto-linked to an existing canonical request (target: matches or beats human-found duplicate rate; measured against review-queue overrides — AI merge precision target ≥ 95% on approved vs. rejected proposals).
3. **Time-to-decision & stakeholder visibility:** % of requests with a published status (planned/declined/shipped) and median days from submission to decision — briefs + priority board should push both up/down respectively.

## 8. Assumptions, risks, tradeoffs

- Single-team, no auth (demo scope) — production needs authn/z + per-tenant data isolation before any real customer data enters the corpus.
- Synchronous triage on submit trades a ~5–10 s submit for pipeline simplicity; production would queue it (the `pending_triage` state and retriage endpoint are already the seam for that).
- LLM outputs are untrusted input: schema-validated, confidence-gated, human-reviewed at the merge boundary. Residual risk: plausible-but-wrong problem statements — mitigated by showing the original text beside the AI interpretation everywhere.
- Priority scores are advisory and explainable, never auto-executing decisions.
- Eval gap (accepted for this exercise): no golden set yet; the `ai_calls` log + review-queue verdicts are designed to become the golden set. First production step: 30–50 labeled dedupe/theme cases run on every prompt change.
