import { getDb } from "@/lib/db";
import type { ThemeSummaryInput } from "@/lib/ai/schema";
import type {
  AiCallLog,
  Brief,
  MergeProposal,
  NewThemeProposal,
  ReviewItem,
  ReviewKind,
  Theme,
  ThemeStatus,
} from "@/lib/types";
import { toBrief, toReviewItem, toTheme } from "@/lib/server/mappers";
import type { BriefRow, ReviewItemRow, ThemeAggregateRow, ThemeRow } from "@/lib/server/rows";

/**
 * Workflow-side data access: themes, review queue, briefs, AI call log.
 * Every statement is parameterized.
 */

const REVIEW_ITEM_SELECT = `
  SELECT ri.*, r.title AS request_title
  FROM review_items ri
  JOIN requests r ON r.id = ri.request_id`;

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export function listThemeSummaries(): ThemeSummaryInput[] {
  return getDb()
    .prepare<[], { id: number; name: string; summary: string }>(
      "SELECT id, name, summary FROM themes ORDER BY id",
    )
    .all();
}

export function getTheme(id: number): Theme | null {
  const row = getDb().prepare<[number], ThemeRow>("SELECT * FROM themes WHERE id = ?").get(id);
  return row ? toTheme(row) : null;
}

/** Case-insensitive, because the model may re-propose an existing theme with different casing. */
export function findThemeByName(name: string): Theme | null {
  const row = getDb()
    .prepare<[string], ThemeRow>("SELECT * FROM themes WHERE name = ? COLLATE NOCASE")
    .get(name);
  return row ? toTheme(row) : null;
}

export function insertTheme(theme: { name: string; summary: string; status: ThemeStatus }): number {
  const result = getDb()
    .prepare<[string, string, string]>("INSERT INTO themes (name, summary, status) VALUES (?, ?, ?)")
    .run(theme.name, theme.summary, theme.status);
  return Number(result.lastInsertRowid);
}

export function setThemeStatus(id: number, status: ThemeStatus): void {
  getDb().prepare<[string, number]>("UPDATE themes SET status = ? WHERE id = ?").run(status, id);
}

/** Deletes a theme and its briefs. Callers unassign requests first (FK). */
export function deleteTheme(id: number): void {
  const db = getDb();
  db.prepare<[number]>("DELETE FROM briefs WHERE theme_id = ?").run(id);
  db.prepare<[number]>("DELETE FROM themes WHERE id = ?").run(id);
}

export function listThemesWithBriefFlag(): Array<{ theme: Theme; hasBrief: boolean }> {
  return getDb()
    .prepare<[], ThemeAggregateRow>(
      `SELECT t.*, EXISTS (SELECT 1 FROM briefs b WHERE b.theme_id = t.id) AS has_brief
       FROM themes t
       ORDER BY CASE t.status WHEN 'confirmed' THEN 0 ELSE 1 END, t.name`,
    )
    .all()
    .map((row) => ({ theme: toTheme(row), hasBrief: row.has_brief === 1 }));
}

// ---------------------------------------------------------------------------
// Review queue
// ---------------------------------------------------------------------------

export function insertReviewItem(item: {
  kind: ReviewKind;
  requestId: number;
  payload: MergeProposal | NewThemeProposal;
}): number {
  const result = getDb()
    .prepare<[string, number, string]>(
      "INSERT INTO review_items (kind, request_id, payload, status) VALUES (?, ?, ?, 'open')",
    )
    .run(item.kind, item.requestId, JSON.stringify(item.payload));
  return Number(result.lastInsertRowid);
}

export function getReviewItem(id: number): ReviewItem | null {
  const row = getDb()
    .prepare<[number], ReviewItemRow>(`${REVIEW_ITEM_SELECT} WHERE ri.id = ?`)
    .get(id);
  return row ? toReviewItem(row) : null;
}

/** Open items first, newest first within each group. */
export function listReviewItems(limit: number): ReviewItem[] {
  return getDb()
    .prepare<[number], ReviewItemRow>(
      `${REVIEW_ITEM_SELECT}
       ORDER BY CASE ri.status WHEN 'open' THEN 0 ELSE 1 END, ri.created_at DESC, ri.id DESC
       LIMIT ?`,
    )
    .all(limit)
    .map(toReviewItem);
}

/**
 * Closes a review item. `resolutionNote`, when given, is stored inside the
 * payload JSON as an audit trail; it is not part of the API payload contract.
 */
export function resolveReviewItem(
  id: number,
  outcome: { status: "approved" | "rejected"; resolutionNote?: string },
): void {
  const db = getDb();
  if (outcome.resolutionNote) {
    db.prepare<[string, number]>(
      "UPDATE review_items SET payload = json_set(payload, '$.resolutionNote', ?) WHERE id = ?",
    ).run(outcome.resolutionNote, id);
  }
  db.prepare<[string, number]>(
    "UPDATE review_items SET status = ?, resolved_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
  ).run(outcome.status, id);
}

// ---------------------------------------------------------------------------
// Briefs
// ---------------------------------------------------------------------------

export function insertBrief(brief: {
  themeId: number;
  contentMd: string;
  model: string;
  promptVersion: string;
}): Brief {
  const db = getDb();
  const result = db
    .prepare<[number, string, string, string]>(
      "INSERT INTO briefs (theme_id, content_md, model, prompt_version) VALUES (?, ?, ?, ?)",
    )
    .run(brief.themeId, brief.contentMd, brief.model, brief.promptVersion);
  const row = db
    .prepare<[number], BriefRow>("SELECT * FROM briefs WHERE id = ?")
    .get(Number(result.lastInsertRowid));
  if (!row) throw new Error("Brief row missing immediately after insert");
  return toBrief(row);
}

export function getLatestBriefRow(themeId: number): Brief | null {
  const row = getDb()
    .prepare<[number], BriefRow>(
      "SELECT * FROM briefs WHERE theme_id = ? ORDER BY created_at DESC, id DESC LIMIT 1",
    )
    .get(themeId);
  return row ? toBrief(row) : null;
}

// ---------------------------------------------------------------------------
// AI call log
// ---------------------------------------------------------------------------

export function insertAiCall(log: AiCallLog): void {
  getDb()
    .prepare<[string, string, string, number, number, number, string]>(
      `INSERT INTO ai_calls (stage, model, prompt_version, latency_ms, input_tokens, output_tokens, outcome)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      log.stage,
      log.model,
      log.promptVersion,
      Math.round(log.latencyMs),
      Math.round(log.inputTokens),
      Math.round(log.outputTokens),
      log.outcome,
    );
}
