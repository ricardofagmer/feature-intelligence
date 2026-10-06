import type { CandidateRequest } from "@/lib/ai/schema";
import type {
  Brief,
  FeatureRequest,
  RequestLink,
  RequestWithMeta,
  ReviewItem,
  Theme,
} from "@/lib/types";
import type {
  BriefRow,
  CandidateRow,
  LinkWithOtherRow,
  RequestRow,
  RequestWithMetaRow,
  ReviewItemRow,
  ThemeRow,
} from "@/lib/server/rows";
import {
  decidedBySchema,
  linkKindSchema,
  requestStatusSchema,
  reviewKindSchema,
  reviewPayloadSchema,
  reviewStatusSchema,
  themeStatusSchema,
} from "@/lib/server/schemas";

// Enum columns are parsed, not cast: a CHECK constraint drift should fail loudly here.

export function toFeatureRequest(row: RequestRow): FeatureRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    requester: row.requester,
    status: requestStatusSchema.parse(row.status),
    problemStatement: row.problem_statement,
    persona: row.persona,
    productArea: row.product_area,
    priorityScore: row.priority_score,
    priorityRationale: row.priority_rationale,
    themeId: row.theme_id,
    canonicalRequestId: row.canonical_request_id,
    createdAt: row.created_at,
    triagedAt: row.triaged_at,
  };
}

export function toRequestWithMeta(row: RequestWithMetaRow): RequestWithMeta {
  return {
    ...toFeatureRequest(row),
    supportCount: row.support_count,
    duplicateCount: row.duplicate_count,
    themeName: row.theme_name,
  };
}

export function toCandidateRequest(row: CandidateRow): CandidateRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    problemStatement: row.problem_statement,
    supportCount: row.support_count,
  };
}

export function toResolvedLink(
  row: LinkWithOtherRow,
): RequestLink & { otherTitle: string; otherId: number } {
  return {
    requestId: row.request_id,
    relatedRequestId: row.related_request_id,
    kind: linkKindSchema.parse(row.kind),
    confidence: row.confidence,
    decidedBy: decidedBySchema.parse(row.decided_by),
    otherId: row.other_id,
    otherTitle: row.other_title,
  };
}

export function toTheme(row: ThemeRow): Theme {
  return {
    id: row.id,
    name: row.name,
    summary: row.summary,
    status: themeStatusSchema.parse(row.status),
    createdAt: row.created_at,
  };
}

export function toReviewItem(row: ReviewItemRow): ReviewItem {
  return {
    id: row.id,
    kind: reviewKindSchema.parse(row.kind),
    requestId: row.request_id,
    requestTitle: row.request_title,
    payload: reviewPayloadSchema.parse(JSON.parse(row.payload)),
    status: reviewStatusSchema.parse(row.status),
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export function toBrief(row: BriefRow): Brief {
  return {
    id: row.id,
    themeId: row.theme_id,
    contentMd: row.content_md,
    model: row.model,
    promptVersion: row.prompt_version,
    createdAt: row.created_at,
  };
}
