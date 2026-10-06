import { getDb } from "@/lib/db";
import { AUTO_MERGE_CONFIDENCE, REVIEW_MIN_CONFIDENCE } from "@/lib/config";
import type { CandidateRequest, DuplicateJudgment, ThemeAssignment, TriageResult } from "@/lib/ai/schema";
import {
  getRequest,
  mergeIntoCanonical,
  saveTriageFields,
  upsertLink,
} from "@/lib/server/repo";
import {
  findThemeByName,
  getTheme,
  insertReviewItem,
  insertTheme,
} from "@/lib/server/repo-workflow";

/** What persisting a triage result changed; feeds the one-sentence summary. */
interface TriageEffects {
  productArea: string;
  persona: string;
  priorityScore: number;
  mergedInto: { id: number; title: string; confidence: number } | null;
  mergeProposals: number;
  relatedLinks: number;
  theme: { kind: "existing" | "proposed"; name: string } | null;
}

export type TriagePersistence =
  | { applied: true; summary: string }
  | { applied: false };

/**
 * Model output is untrusted: judgments are only honored for ids that were in
 * the candidate set we sent, never for the request itself, and only the
 * strongest judgment per candidate counts.
 */
function trustedJudgments(
  requestId: number,
  judgments: DuplicateJudgment[],
  candidates: CandidateRequest[],
): Array<DuplicateJudgment & { title: string }> {
  const titles = new Map(candidates.map((candidate) => [candidate.id, candidate.title]));
  const best = new Map<number, DuplicateJudgment & { title: string }>();
  for (const judgment of judgments) {
    const title = titles.get(judgment.candidateId);
    if (title === undefined || judgment.candidateId === requestId) continue;
    const current = best.get(judgment.candidateId);
    if (!current || judgment.confidence > current.confidence) {
      best.set(judgment.candidateId, { ...judgment, title });
    }
  }
  return [...best.values()].sort((a, b) => b.confidence - a.confidence);
}

/** Follows one merge hop: a target merged elsewhere while the model was thinking redirects to its canonical. */
function resolveMergeTarget(requestId: number, candidateId: number): { id: number; title: string } | null {
  const target = getRequest(candidateId);
  if (!target) return null;
  if (target.status !== "merged" || target.canonicalRequestId === null) {
    return { id: target.id, title: target.title };
  }
  if (target.canonicalRequestId === requestId) return null;
  const canonical = getRequest(target.canonicalRequestId);
  return canonical ? { id: canonical.id, title: canonical.title } : null;
}

function resolveTheme(
  requestId: number,
  assignment: ThemeAssignment,
): { themeId: number | null; effect: TriageEffects["theme"] } {
  if (assignment.kind === "existing") {
    const theme = getTheme(assignment.themeId);
    return theme
      ? { themeId: theme.id, effect: { kind: "existing", name: theme.name } }
      : { themeId: null, effect: null };
  }
  if (assignment.kind === "new") {
    const existing = findThemeByName(assignment.name);
    if (existing) {
      return { themeId: existing.id, effect: { kind: "existing", name: existing.name } };
    }
    const themeId = insertTheme({ name: assignment.name, summary: assignment.summary, status: "proposed" });
    insertReviewItem({
      kind: "new_theme",
      requestId,
      payload: { kind: "new_theme", name: assignment.name, summary: assignment.summary },
    });
    return { themeId, effect: { kind: "proposed", name: assignment.name } };
  }
  return { themeId: null, effect: null };
}

function applyDuplicates(
  requestId: number,
  judgments: Array<DuplicateJudgment & { title: string }>,
): Pick<TriageEffects, "mergedInto" | "mergeProposals" | "relatedLinks"> {
  let mergedInto: TriageEffects["mergedInto"] = null;
  let relatedLinks = 0;
  const reviewCandidates: Array<DuplicateJudgment & { title: string }> = [];

  for (const judgment of judgments) {
    if (judgment.verdict === "duplicate" && judgment.confidence >= AUTO_MERGE_CONFIDENCE) {
      const target = resolveMergeTarget(requestId, judgment.candidateId);
      if (!target) continue;
      upsertLink({
        requestId,
        relatedRequestId: target.id,
        kind: "duplicate",
        confidence: judgment.confidence,
        decidedBy: "ai",
      });
      // Judgments are sorted by confidence, so the first auto-merge is the canonical.
      if (!mergedInto) {
        mergeIntoCanonical(requestId, target.id);
        mergedInto = { id: target.id, title: target.title, confidence: judgment.confidence };
      }
    } else if (judgment.verdict === "duplicate" && judgment.confidence >= REVIEW_MIN_CONFIDENCE) {
      reviewCandidates.push(judgment);
    } else if (judgment.verdict === "related" && judgment.confidence >= REVIEW_MIN_CONFIDENCE) {
      upsertLink({
        requestId,
        relatedRequestId: judgment.candidateId,
        kind: "related",
        confidence: judgment.confidence,
        decidedBy: "ai",
      });
      relatedLinks += 1;
    }
  }

  // Once auto-merged, weaker merge proposals for the same request would only be queue noise.
  if (!mergedInto) {
    for (const judgment of reviewCandidates) {
      insertReviewItem({
        kind: "merge",
        requestId,
        payload: {
          kind: "merge",
          targetRequestId: judgment.candidateId,
          targetRequestTitle: judgment.title,
          confidence: judgment.confidence,
          reasoning: judgment.reasoning,
        },
      });
    }
  }
  return { mergedInto, mergeProposals: mergedInto ? 0 : reviewCandidates.length, relatedLinks };
}

function describe(effects: TriageEffects): string {
  const parts = [
    `Triaged as a ${effects.productArea} request for ${effects.persona} with priority ${Math.round(effects.priorityScore)}/100`,
  ];
  if (effects.mergedInto) {
    const percent = Math.round(effects.mergedInto.confidence * 100);
    parts.push(`merged into #${effects.mergedInto.id} "${effects.mergedInto.title}" as a duplicate (${percent}% confidence)`);
  }
  if (effects.mergeProposals > 0) {
    parts.push(`${effects.mergeProposals} possible duplicate${effects.mergeProposals === 1 ? "" : "s"} sent to review`);
  }
  if (effects.relatedLinks > 0) {
    parts.push(`linked to ${effects.relatedLinks} related request${effects.relatedLinks === 1 ? "" : "s"}`);
  }
  if (effects.theme?.kind === "existing") parts.push(`grouped under theme "${effects.theme.name}"`);
  if (effects.theme?.kind === "proposed") parts.push(`proposed new theme "${effects.theme.name}" for review`);
  return `${parts.join("; ")}.`;
}

/**
 * Persists a validated triage result atomically. Skips (applied: false) when
 * the request left the triageable states during the model call, so two
 * concurrent retriage runs cannot both write links and review items.
 */
export function persistTriageResult(
  requestId: number,
  result: TriageResult,
  candidates: CandidateRequest[],
): TriagePersistence {
  return getDb().transaction((): TriagePersistence => {
    const request = getRequest(requestId);
    if (!request || (request.status !== "new" && request.status !== "pending_triage")) {
      return { applied: false };
    }
    const theme = resolveTheme(requestId, result.theme);
    saveTriageFields(requestId, {
      problemStatement: result.problemStatement,
      persona: result.persona,
      productArea: result.productArea,
      priorityScore: result.priorityScore,
      priorityRationale: result.priorityRationale,
      themeId: theme.themeId,
    });
    const duplicates = applyDuplicates(requestId, trustedJudgments(requestId, result.duplicates, candidates));
    const summary = describe({
      productArea: result.productArea,
      persona: result.persona,
      priorityScore: result.priorityScore,
      theme: theme.effect,
      ...duplicates,
    });
    return { applied: true, summary };
  })();
}
