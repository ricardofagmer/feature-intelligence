import { getDb } from "@/lib/db";
import { DEDUPE_CANDIDATE_LIMIT, PRODUCT_GOALS } from "@/lib/config";
import { triageRequest } from "@/lib/ai/triage";
import type { CandidateRequest, TriageOutcome } from "@/lib/ai/schema";
import type { CreateRequestBody, CreateRequestResponse, RequestWithMeta, VoteResponse } from "@/lib/types";
import { persistAiCall } from "@/lib/server/ai-call-logger";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import {
  countSupport,
  getRequest,
  getRequestWithMeta,
  hasConsolidatedVote,
  insertRequest,
  insertVote,
  searchCandidates,
  setRequestStatus,
} from "@/lib/server/repo";
import { listThemeSummaries } from "@/lib/server/repo-workflow";
import { persistTriageResult } from "@/lib/server/triage-persistence";

const ANONYMOUS_REQUESTER = "anonymous";

function requireRequestWithMeta(id: number): RequestWithMeta {
  const request = getRequestWithMeta(id);
  if (!request) throw new NotFoundError(`Request ${id} was not found.`);
  return request;
}

async function callTriage(requestId: number, title: string, description: string): Promise<{
  outcome: TriageOutcome;
  candidates: CandidateRequest[];
}> {
  // One extra row so the request itself can be dropped without shrinking the candidate set.
  const candidates = searchCandidates(title, description, DEDUPE_CANDIDATE_LIMIT + 1)
    .filter((candidate) => candidate.id !== requestId)
    .slice(0, DEDUPE_CANDIDATE_LIMIT);
  const input = { title, description, candidates, themes: listThemeSummaries(), productGoals: PRODUCT_GOALS };
  try {
    return { outcome: await triageRequest(input, persistAiCall), candidates };
  } catch (error) {
    // The AI module contract is to never throw; if it does, submission still must not fail.
    console.error(
      JSON.stringify({
        event: "triage_unexpected_error",
        requestId,
        error: error instanceof Error ? error.name : "unknown",
      }),
    );
    return { outcome: { ok: false, code: "ai_unavailable", message: "Triage threw unexpectedly" }, candidates };
  }
}

/**
 * Runs the pipeline outside any transaction (the model call is slow) and then
 * persists atomically. Returns the summary, or null when the request is left
 * pending for a later retriage.
 */
async function runTriage(requestId: number, title: string, description: string): Promise<string | null> {
  const { outcome, candidates } = await callTriage(requestId, title, description);
  if (!outcome.ok) {
    const current = getRequest(requestId);
    if (current?.status === "new") setRequestStatus(requestId, "pending_triage");
    return null;
  }
  const persisted = persistTriageResult(requestId, outcome.result, candidates);
  return persisted.applied ? persisted.summary : null;
}

export async function createRequest(body: CreateRequestBody): Promise<CreateRequestResponse> {
  const requester = body.requester?.trim() || ANONYMOUS_REQUESTER;
  const id = insertRequest({ title: body.title, description: body.description, requester });
  const triageSummary = await runTriage(id, body.title, body.description);
  return { request: requireRequestWithMeta(id), triageSummary };
}

export async function retriage(id: number): Promise<CreateRequestResponse> {
  const request = getRequest(id);
  if (!request) throw new NotFoundError(`Request ${id} was not found.`);
  if (request.status !== "pending_triage") {
    throw new ConflictError(`Request ${id} is not pending triage (status: ${request.status}).`);
  }
  const triageSummary = await runTriage(id, request.title, request.description);
  return { request: requireRequestWithMeta(id), triageSummary };
}

/**
 * Votes are dedupe-aware: a voter who already backs the canonical (directly or
 * via any merged duplicate) cannot add support again through another copy.
 */
export function vote(id: number, voter: string): VoteResponse {
  return getDb().transaction((): VoteResponse => {
    const request = getRequest(id);
    if (!request) throw new NotFoundError(`Request ${id} was not found.`);
    const canonicalId =
      request.status === "merged" && request.canonicalRequestId !== null ? request.canonicalRequestId : id;
    if (hasConsolidatedVote(canonicalId, voter)) {
      throw new ConflictError("This voter already supports this request.");
    }
    insertVote(id, voter);
    return { supportCount: countSupport(id) };
  })();
}
