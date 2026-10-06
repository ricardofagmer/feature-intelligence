import { z } from "zod";
import type { AiCallLog } from "@/lib/types";

/**
 * Frozen contract between the AI pipeline (src/lib/ai) and the backend
 * services that consume it. Model output is untrusted input: everything the
 * model returns is validated against these schemas before it crosses into the
 * domain.
 */

// ---------------------------------------------------------------------------
// Inputs the backend assembles for the pipeline
// ---------------------------------------------------------------------------

export interface CandidateRequest {
  id: number;
  title: string;
  description: string;
  problemStatement: string | null;
  supportCount: number;
}

export interface ThemeSummaryInput {
  id: number;
  name: string;
  summary: string;
}

export interface TriageInput {
  title: string;
  description: string;
  /** FTS-prefiltered existing requests to judge for duplication. */
  candidates: CandidateRequest[];
  /** Existing themes the model may assign to. */
  themes: ThemeSummaryInput[];
  productGoals: readonly string[];
}

export interface BriefRequestEvidence {
  id: number;
  title: string;
  problemStatement: string | null;
  supportCount: number;
  priorityScore: number | null;
}

export interface BriefInput {
  themeName: string;
  themeSummary: string;
  requests: BriefRequestEvidence[];
  productGoals: readonly string[];
}

// ---------------------------------------------------------------------------
// Validated model outputs
// ---------------------------------------------------------------------------

export const duplicateJudgmentSchema = z.object({
  candidateId: z.number().int(),
  verdict: z.enum(["duplicate", "related", "distinct"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(600),
});

export const themeAssignmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("existing"), themeId: z.number().int() }),
  z.object({
    kind: z.literal("new"),
    name: z.string().min(3).max(80),
    summary: z.string().min(10).max(400),
  }),
  z.object({ kind: z.literal("none") }),
]);

export const triageResultSchema = z.object({
  problemStatement: z.string().min(10).max(600),
  persona: z.string().min(2).max(120),
  productArea: z.string().min(2).max(80),
  duplicates: z.array(duplicateJudgmentSchema).max(16),
  theme: themeAssignmentSchema,
  priorityScore: z.number().min(0).max(100),
  priorityRationale: z.string().min(10).max(800),
});

export type DuplicateJudgment = z.infer<typeof duplicateJudgmentSchema>;
export type ThemeAssignment = z.infer<typeof themeAssignmentSchema>;
export type TriageResult = z.infer<typeof triageResultSchema>;

// ---------------------------------------------------------------------------
// Pipeline outcomes (typed failure, never thrown across the boundary)
// ---------------------------------------------------------------------------

export type TriageOutcome =
  | { ok: true; result: TriageResult }
  | { ok: false; code: "ai_unavailable" | "invalid_output"; message: string };

export type BriefOutcome =
  | { ok: true; contentMd: string; model: string; promptVersion: string }
  | { ok: false; code: "ai_unavailable" | "invalid_output"; message: string };

/** The backend passes a persister; the AI module never touches the database. */
export type AiCallLogger = (log: AiCallLog) => void;
