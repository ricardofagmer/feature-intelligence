import { getDb } from "@/lib/db";
import type { CandidateRequest } from "@/lib/ai/schema";
import type {
  DecidedBy,
  FeatureRequest,
  LinkKind,
  RequestLink,
  RequestStatus,
  RequestWithMeta,
} from "@/lib/types";
import { buildCandidateQuery } from "@/lib/server/fts";
import {
  toCandidateRequest,
  toFeatureRequest,
  toRequestWithMeta,
  toResolvedLink,
} from "@/lib/server/mappers";
import type {
  CandidateRow,
  LinkWithOtherRow,
  RequestRow,
  RequestWithMetaRow,
  ThemedRequestRow,
} from "@/lib/server/rows";

/**
 * Request-side data access: requests, votes, links, FTS retrieval. Every
 * statement is parameterized; dynamic SQL is only ever assembled from the
 * constant fragments below, never from caller text.
 */

/**
 * Effective support: distinct voters across the request and every request
 * merged into it. Distinct so one person voting on both a duplicate and its
 * canonical is counted once.
 */
const SUPPORT_SQL = `(
  SELECT COUNT(DISTINCT v.voter) FROM votes v
  JOIN requests s ON s.id = v.request_id
  WHERE s.id = r.id OR s.canonical_request_id = r.id
)`;

const REQUEST_WITH_META_SELECT = `
  SELECT r.*, t.name AS theme_name,
    ${SUPPORT_SQL} AS support_count,
    (SELECT COUNT(*) FROM requests m WHERE m.canonical_request_id = r.id) AS duplicate_count
  FROM requests r
  LEFT JOIN themes t ON t.id = r.theme_id`;

const ORDER_BY: Record<RequestSort, string> = {
  priority: "r.priority_score DESC NULLS LAST, r.created_at DESC, r.id DESC",
  support: "support_count DESC, r.created_at DESC, r.id DESC",
  new: "r.created_at DESC, r.id DESC",
};

export type RequestSort = "priority" | "support" | "new";

export interface RequestFilter {
  /** Exact status; when absent, merged requests are hidden. */
  status?: RequestStatus;
  themeId?: number;
  /** Pre-built, sanitized FTS5 expression (see fts.ts). */
  ftsQuery?: string;
  sort: RequestSort;
  limit: number;
}

export interface NewRequestRecord {
  title: string;
  description: string;
  requester: string;
}

export interface TriageFields {
  problemStatement: string;
  persona: string;
  productArea: string;
  priorityScore: number;
  priorityRationale: string;
  themeId: number | null;
}

export function insertRequest(record: NewRequestRecord): number {
  const result = getDb()
    .prepare<[string, string, string]>(
      "INSERT INTO requests (title, description, requester, status) VALUES (?, ?, ?, 'new')",
    )
    .run(record.title, record.description, record.requester);
  return Number(result.lastInsertRowid);
}

export function getRequest(id: number): FeatureRequest | null {
  const row = getDb()
    .prepare<[number], RequestRow>("SELECT * FROM requests WHERE id = ?")
    .get(id);
  return row ? toFeatureRequest(row) : null;
}

export function getRequestWithMeta(id: number): RequestWithMeta | null {
  const row = getDb()
    .prepare<[number], RequestWithMetaRow>(`${REQUEST_WITH_META_SELECT} WHERE r.id = ?`)
    .get(id);
  return row ? toRequestWithMeta(row) : null;
}

export function queryRequests(filter: RequestFilter): RequestWithMeta[] {
  const where: string[] = [];
  const params: Array<string | number> = [];
  if (filter.status) {
    where.push("r.status = ?");
    params.push(filter.status);
  } else {
    where.push("r.status != 'merged'");
  }
  if (filter.themeId !== undefined) {
    where.push("r.theme_id = ?");
    params.push(filter.themeId);
  }
  if (filter.ftsQuery) {
    where.push("r.id IN (SELECT rowid FROM requests_fts WHERE requests_fts MATCH ?)");
    params.push(filter.ftsQuery);
  }
  params.push(filter.limit);
  const sql = `${REQUEST_WITH_META_SELECT}
    WHERE ${where.join(" AND ")}
    ORDER BY ${ORDER_BY[filter.sort]}
    LIMIT ?`;
  return getDb().prepare<Array<string | number>, RequestWithMetaRow>(sql).all(...params).map(toRequestWithMeta);
}

/** Lexical duplicate candidates, best BM25 match first. Merged requests are never candidates. */
export function searchCandidates(title: string, description: string, limit: number): CandidateRequest[] {
  const query = buildCandidateQuery(title, description);
  if (!query) return [];
  return getDb()
    .prepare<[string, number], CandidateRow>(
      `SELECT r.id, r.title, r.description, r.problem_statement, ${SUPPORT_SQL} AS support_count
       FROM requests_fts
       JOIN requests r ON r.id = requests_fts.rowid
       WHERE requests_fts MATCH ? AND r.status != 'merged'
       ORDER BY bm25(requests_fts)
       LIMIT ?`,
    )
    .all(query, limit)
    .map(toCandidateRequest);
}

export function saveTriageFields(id: number, fields: TriageFields): void {
  getDb()
    .prepare<[string, string, string, number, string, number | null, number]>(
      `UPDATE requests SET
         problem_statement = ?, persona = ?, product_area = ?,
         priority_score = ?, priority_rationale = ?, theme_id = ?,
         status = 'triaged', triaged_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
       WHERE id = ?`,
    )
    .run(
      fields.problemStatement,
      fields.persona,
      fields.productArea,
      fields.priorityScore,
      fields.priorityRationale,
      fields.themeId,
      id,
    );
}

export function setRequestStatus(id: number, status: RequestStatus): void {
  getDb().prepare<[string, number]>("UPDATE requests SET status = ? WHERE id = ?").run(status, id);
}

/**
 * Marks a request as merged into its canonical and re-points anything that was
 * merged into it, so support stays consolidated on a single canonical (no chains).
 */
export function mergeIntoCanonical(id: number, canonicalId: number): void {
  const db = getDb();
  db.prepare<[number, number]>(
    "UPDATE requests SET status = 'merged', canonical_request_id = ? WHERE id = ?",
  ).run(canonicalId, id);
  db.prepare<[number, number]>(
    "UPDATE requests SET canonical_request_id = ? WHERE canonical_request_id = ?",
  ).run(canonicalId, id);
}

export function upsertLink(link: {
  requestId: number;
  relatedRequestId: number;
  kind: LinkKind;
  confidence: number;
  decidedBy: DecidedBy;
}): void {
  getDb()
    .prepare<[number, number, string, number, string]>(
      `INSERT INTO request_links (request_id, related_request_id, kind, confidence, decided_by)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (request_id, related_request_id) DO UPDATE SET
         kind = excluded.kind, confidence = excluded.confidence, decided_by = excluded.decided_by`,
    )
    .run(link.requestId, link.relatedRequestId, link.kind, link.confidence, link.decidedBy);
}

/** Links in both directions, each resolved to the request on the other end. */
export function listResolvedLinks(id: number): Array<RequestLink & { otherTitle: string; otherId: number }> {
  return getDb()
    .prepare<[number, number, number], LinkWithOtherRow>(
      `SELECT l.request_id, l.related_request_id, l.kind, l.confidence, l.decided_by,
              o.id AS other_id, o.title AS other_title
       FROM request_links l
       JOIN requests o ON o.id = CASE WHEN l.request_id = ? THEN l.related_request_id ELSE l.request_id END
       WHERE l.request_id = ? OR l.related_request_id = ?
       ORDER BY l.kind, l.confidence DESC`,
    )
    .all(id, id, id)
    .map(toResolvedLink);
}

/** Distinct voters behind the request's effective support (its own plus merged duplicates). */
export function listConsolidatedVoters(id: number): string[] {
  return getDb()
    .prepare<[number, number], { voter: string }>(
      `SELECT v.voter FROM votes v
       JOIN requests s ON s.id = v.request_id
       WHERE s.id = ? OR s.canonical_request_id = ?
       GROUP BY v.voter
       ORDER BY MIN(v.created_at), v.voter`,
    )
    .all(id, id)
    .map((row) => row.voter);
}

/** True when the voter already backs the canonical, directly or through a merged duplicate. */
export function hasConsolidatedVote(canonicalId: number, voter: string): boolean {
  const row = getDb()
    .prepare<[number, number, string], { found: number }>(
      `SELECT 1 AS found FROM votes v
       JOIN requests s ON s.id = v.request_id
       WHERE (s.id = ? OR s.canonical_request_id = ?) AND v.voter = ?
       LIMIT 1`,
    )
    .get(canonicalId, canonicalId, voter);
  return row !== undefined;
}

export function insertVote(requestId: number, voter: string): void {
  getDb().prepare<[number, string]>("INSERT INTO votes (request_id, voter) VALUES (?, ?)").run(requestId, voter);
}

export function countSupport(id: number): number {
  const row = getDb()
    .prepare<[number], { support_count: number }>(
      `SELECT ${SUPPORT_SQL} AS support_count FROM requests r WHERE r.id = ?`,
    )
    .get(id);
  return row?.support_count ?? 0;
}

/** Active (non-merged) requests that carry a theme, best supported first. Feeds theme aggregates and brief evidence. */
export function listThemedRequests(themeId?: number): ThemedRequestRow[] {
  const db = getDb();
  const base = `SELECT r.id, r.title, r.theme_id, r.priority_score, r.problem_statement, ${SUPPORT_SQL} AS support_count
    FROM requests r
    WHERE r.status != 'merged' AND r.theme_id IS NOT NULL`;
  const order = "ORDER BY support_count DESC, r.priority_score DESC NULLS LAST, r.id ASC";
  if (themeId === undefined) {
    return db.prepare<[], ThemedRequestRow>(`${base} ${order}`).all();
  }
  return db.prepare<[number], ThemedRequestRow>(`${base} AND r.theme_id = ? ${order}`).all(themeId);
}

export function unassignTheme(themeId: number): void {
  getDb().prepare<[number]>("UPDATE requests SET theme_id = NULL WHERE theme_id = ?").run(themeId);
}
