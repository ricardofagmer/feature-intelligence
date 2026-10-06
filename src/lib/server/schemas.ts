import { z } from "zod";
import type {
  LinkKind,
  DecidedBy,
  MergeProposal,
  NewThemeProposal,
  RequestStatus,
  ReviewKind,
  ReviewStatus,
  ThemeStatus,
} from "@/lib/types";

/** Input bounds. Shared by route validation and the services that trust them afterwards. */
export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 5000;
export const REQUESTER_MAX_LENGTH = 80;
export const VOTER_MAX_LENGTH = 80;
export const SEARCH_QUERY_MAX_LENGTH = 200;
/** Largest legitimate body is title + description + requester as JSON; anything above is rejected unread. */
export const MAX_BODY_BYTES = 16 * 1024;

export const requestStatusSchema: z.ZodType<RequestStatus> = z.enum([
  "new",
  "pending_triage",
  "triaged",
  "merged",
  "planned",
  "declined",
  "shipped",
]);
export const themeStatusSchema: z.ZodType<ThemeStatus> = z.enum(["confirmed", "proposed"]);
export const linkKindSchema: z.ZodType<LinkKind> = z.enum(["duplicate", "related"]);
export const decidedBySchema: z.ZodType<DecidedBy> = z.enum(["ai", "human"]);
export const reviewKindSchema: z.ZodType<ReviewKind> = z.enum(["merge", "new_theme"]);
export const reviewStatusSchema: z.ZodType<ReviewStatus> = z.enum(["open", "approved", "rejected"]);

export const mergeProposalSchema: z.ZodType<MergeProposal> = z.object({
  kind: z.literal("merge"),
  targetRequestId: z.number().int(),
  targetRequestTitle: z.string(),
  confidence: z.number(),
  reasoning: z.string(),
});

export const newThemeProposalSchema: z.ZodType<NewThemeProposal> = z.object({
  kind: z.literal("new_theme"),
  name: z.string(),
  summary: z.string(),
});

export const reviewPayloadSchema = z.union([mergeProposalSchema, newThemeProposalSchema]);

// ---------------------------------------------------------------------------
// HTTP boundary schemas (strict: unexpected fields are rejected, not dropped)
// ---------------------------------------------------------------------------

export const createRequestBodySchema = z.strictObject({
  title: z.string().trim().min(3).max(TITLE_MAX_LENGTH),
  description: z.string().trim().min(10).max(DESCRIPTION_MAX_LENGTH),
  requester: z.string().trim().max(REQUESTER_MAX_LENGTH).optional(),
});

export const voteBodySchema = z.strictObject({
  voter: z.string().trim().min(1).max(VOTER_MAX_LENGTH),
});

export const reviewActionBodySchema = z.strictObject({
  action: z.enum(["approve", "reject"]),
});

// Query strings stay lenient on unknown keys: proxies and clients append cache busters.
export const listRequestsQuerySchema = z.object({
  status: requestStatusSchema.optional(),
  theme: z.coerce.number().int().positive().optional(),
  sort: z.enum(["priority", "support", "new"]).optional(),
  q: z.string().trim().max(SEARCH_QUERY_MAX_LENGTH).optional(),
});

export const idParamSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
