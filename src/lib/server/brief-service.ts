import { PRODUCT_GOALS } from "@/lib/config";
import { generateBrief } from "@/lib/ai/brief";
import type { BriefInput, BriefOutcome, BriefRequestEvidence } from "@/lib/ai/schema";
import type { Brief } from "@/lib/types";
import { persistAiCall } from "@/lib/server/ai-call-logger";
import { AiUnavailableError, ConflictError, NotFoundError } from "@/lib/server/errors";
import { listThemedRequests } from "@/lib/server/repo";
import { getTheme, insertBrief } from "@/lib/server/repo-workflow";

/** Bounds the prompt: the best-supported requests carry the evidence, the long tail adds tokens not signal. */
const BRIEF_EVIDENCE_LIMIT = 40;
const AI_UNAVAILABLE_MESSAGE = "Decision brief generation is unavailable right now. Try again later.";

async function callGenerateBrief(input: BriefInput): Promise<BriefOutcome> {
  try {
    return await generateBrief(input, persistAiCall);
  } catch (error) {
    // The AI module contract is to never throw; surface it as unavailable rather than a 500.
    console.error(
      JSON.stringify({ event: "brief_unexpected_error", error: error instanceof Error ? error.name : "unknown" }),
    );
    return { ok: false, code: "ai_unavailable", message: "Brief generation threw unexpectedly" };
  }
}

export async function createBrief(themeId: number): Promise<Brief> {
  const theme = getTheme(themeId);
  if (!theme) throw new NotFoundError(`Theme ${themeId} was not found.`);

  const requests: BriefRequestEvidence[] = listThemedRequests(themeId)
    .slice(0, BRIEF_EVIDENCE_LIMIT)
    .map((row) => ({
      id: row.id,
      title: row.title,
      problemStatement: row.problem_statement,
      supportCount: row.support_count,
      priorityScore: row.priority_score,
    }));
  if (requests.length === 0) {
    throw new ConflictError(`Theme ${themeId} has no active requests to brief on.`);
  }

  const outcome = await callGenerateBrief({
    themeName: theme.name,
    themeSummary: theme.summary,
    requests,
    productGoals: PRODUCT_GOALS,
  });
  if (!outcome.ok) throw new AiUnavailableError(AI_UNAVAILABLE_MESSAGE);

  return insertBrief({
    themeId,
    contentMd: outcome.contentMd,
    model: outcome.model,
    promptVersion: outcome.promptVersion,
  });
}
