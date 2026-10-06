import { getDb } from "@/lib/db";
import type { MergeProposal, NewThemeProposal, ReviewItem } from "@/lib/types";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { getRequest, mergeIntoCanonical, unassignTheme, upsertLink } from "@/lib/server/repo";
import {
  deleteTheme,
  findThemeByName,
  getReviewItem,
  resolveReviewItem,
  setThemeStatus,
} from "@/lib/server/repo-workflow";

export type ReviewAction = "approve" | "reject";

/**
 * Applies an approved merge. Returns a resolution note when the merge was a
 * no-op because the world moved on since the proposal was made.
 */
function approveMerge(item: ReviewItem, proposal: MergeProposal): string | undefined {
  const request = getRequest(item.requestId);
  if (!request) return "no-op: request no longer exists";
  if (request.status === "merged") {
    return `no-op: request was already merged into #${request.canonicalRequestId ?? "unknown"}`;
  }
  const target = getRequest(proposal.targetRequestId);
  if (!target) return "no-op: target request no longer exists";
  // The target may itself have been merged since; consolidate onto its canonical instead.
  const canonicalId =
    target.status === "merged" && target.canonicalRequestId !== null ? target.canonicalRequestId : target.id;
  if (canonicalId === request.id) return "no-op: target is already merged into this request";

  upsertLink({
    requestId: request.id,
    relatedRequestId: canonicalId,
    kind: "duplicate",
    confidence: proposal.confidence,
    decidedBy: "human",
  });
  mergeIntoCanonical(request.id, canonicalId);
  return canonicalId === target.id ? undefined : `merged into canonical #${canonicalId} of target #${target.id}`;
}

function approveNewTheme(proposal: NewThemeProposal): string | undefined {
  const theme = findThemeByName(proposal.name);
  if (!theme) return "no-op: proposed theme no longer exists";
  if (theme.status === "proposed") setThemeStatus(theme.id, "confirmed");
  return undefined;
}

function rejectNewTheme(proposal: NewThemeProposal): string | undefined {
  const theme = findThemeByName(proposal.name);
  // A confirmed theme is shared state now; rejecting this proposal must not delete it.
  if (!theme || theme.status !== "proposed") return "no-op: theme is not in proposed state";
  unassignTheme(theme.id);
  deleteTheme(theme.id);
  return undefined;
}

export function applyReviewAction(id: number, action: ReviewAction): ReviewItem {
  return getDb().transaction((): ReviewItem => {
    const item = getReviewItem(id);
    if (!item) throw new NotFoundError(`Review item ${id} was not found.`);
    if (item.status !== "open") throw new ConflictError(`Review item ${id} is already ${item.status}.`);

    const payload = item.payload;
    let resolutionNote: string | undefined;
    if (payload.kind === "merge" && action === "approve") resolutionNote = approveMerge(item, payload);
    if (payload.kind === "new_theme" && action === "approve") resolutionNote = approveNewTheme(payload);
    if (payload.kind === "new_theme" && action === "reject") resolutionNote = rejectNewTheme(payload);
    // Rejecting a merge leaves the request untouched by design.

    resolveReviewItem(id, { status: action === "approve" ? "approved" : "rejected", resolutionNote });
    const resolved = getReviewItem(id);
    if (!resolved) throw new Error(`Review item ${id} vanished inside its own transaction`);
    return resolved;
  })();
}
