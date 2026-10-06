/**
 * Frozen domain and API contracts. Backend, AI pipeline, and frontend all code
 * against this file; changes here require re-checking all three.
 */

export type RequestStatus =
  | "new" // stored, triage not attempted yet (transient)
  | "pending_triage" // triage failed or no API key; retriable
  | "triaged" // AI pipeline completed
  | "merged" // consolidated into a canonical request
  | "planned"
  | "declined"
  | "shipped";

export type ThemeStatus = "confirmed" | "proposed";
export type LinkKind = "duplicate" | "related";
export type DecidedBy = "ai" | "human";
export type ReviewKind = "merge" | "new_theme";
export type ReviewStatus = "open" | "approved" | "rejected";

export interface FeatureRequest {
  id: number;
  title: string;
  description: string;
  requester: string;
  status: RequestStatus;
  problemStatement: string | null;
  persona: string | null;
  productArea: string | null;
  priorityScore: number | null;
  priorityRationale: string | null;
  themeId: number | null;
  canonicalRequestId: number | null;
  createdAt: string;
  triagedAt: string | null;
}

/** List-view projection: request + aggregates the board needs. */
export interface RequestWithMeta extends FeatureRequest {
  supportCount: number; // own votes + votes on requests merged into this one
  duplicateCount: number; // requests merged into this one
  themeName: string | null;
}

export interface RequestLink {
  requestId: number;
  relatedRequestId: number;
  kind: LinkKind;
  confidence: number;
  decidedBy: DecidedBy;
}

export interface Theme {
  id: number;
  name: string;
  summary: string;
  status: ThemeStatus;
  createdAt: string;
}

export interface ThemeWithStats extends Theme {
  requestCount: number;
  totalSupport: number;
  topRequestTitles: string[];
  avgPriorityScore: number | null;
  hasBrief: boolean;
}

export interface ReviewItem {
  id: number;
  kind: ReviewKind;
  requestId: number;
  requestTitle: string;
  payload: MergeProposal | NewThemeProposal;
  status: ReviewStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface MergeProposal {
  kind: "merge";
  targetRequestId: number;
  targetRequestTitle: string;
  confidence: number;
  reasoning: string;
}

export interface NewThemeProposal {
  kind: "new_theme";
  name: string;
  summary: string;
}

export interface Brief {
  id: number;
  themeId: number;
  contentMd: string;
  model: string;
  promptVersion: string;
  createdAt: string;
}

/** One logged AI call (observability + future golden set). */
export interface AiCallLog {
  stage: "triage" | "brief";
  model: string;
  promptVersion: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  outcome: "ok" | "invalid_output" | "error";
}

// ---------------------------------------------------------------------------
// API error envelope (stable codes; clients switch on `code`, never message)
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | "invalid_request"
  | "not_found"
  | "conflict"
  | "ai_unavailable"
  | "internal";

export interface ApiError {
  statusCode: number;
  code: ApiErrorCode;
  message: string;
}

// ---------------------------------------------------------------------------
// API payloads
// ---------------------------------------------------------------------------

export interface CreateRequestBody {
  title: string;
  description: string;
  requester?: string;
}

export interface CreateRequestResponse {
  request: RequestWithMeta;
  /** Present when triage ran: what the AI decided, for immediate UI feedback. */
  triageSummary: string | null;
}

export interface ListRequestsResponse {
  requests: RequestWithMeta[];
}

export interface RequestDetailResponse {
  request: RequestWithMeta;
  theme: Theme | null;
  /** Outbound + inbound links, both directions resolved to titles. */
  links: Array<RequestLink & { otherTitle: string; otherId: number }>;
  voters: string[];
}

export interface VoteResponse {
  supportCount: number;
}

export interface ListThemesResponse {
  themes: ThemeWithStats[];
}

export interface ReviewListResponse {
  items: ReviewItem[];
}

export interface ReviewActionBody {
  action: "approve" | "reject";
}

export interface BriefResponse {
  brief: Brief;
}
