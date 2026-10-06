/** Raw SQLite row shapes (snake_case columns as stored). Only repositories and mappers see these. */

export interface RequestRow {
  id: number;
  title: string;
  description: string;
  requester: string;
  status: string;
  problem_statement: string | null;
  persona: string | null;
  product_area: string | null;
  priority_score: number | null;
  priority_rationale: string | null;
  theme_id: number | null;
  canonical_request_id: number | null;
  created_at: string;
  triaged_at: string | null;
}

export interface RequestWithMetaRow extends RequestRow {
  support_count: number;
  duplicate_count: number;
  theme_name: string | null;
}

export interface CandidateRow {
  id: number;
  title: string;
  description: string;
  problem_statement: string | null;
  support_count: number;
}

export interface LinkWithOtherRow {
  request_id: number;
  related_request_id: number;
  kind: string;
  confidence: number;
  decided_by: string;
  other_id: number;
  other_title: string;
}

export interface ThemeRow {
  id: number;
  name: string;
  summary: string;
  status: string;
  created_at: string;
}

export interface ThemeAggregateRow extends ThemeRow {
  has_brief: number;
}

export interface ThemedRequestRow {
  id: number;
  title: string;
  theme_id: number;
  priority_score: number | null;
  problem_statement: string | null;
  support_count: number;
}

export interface ReviewItemRow {
  id: number;
  kind: string;
  request_id: number;
  request_title: string;
  payload: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface BriefRow {
  id: number;
  theme_id: number;
  content_md: string;
  model: string;
  prompt_version: string;
  created_at: string;
}
