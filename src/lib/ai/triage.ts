import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { isAiConfigured } from "@/lib/config";
import {
  triageResultSchema,
  type AiCallLogger,
  type TriageInput,
  type TriageOutcome,
  type TriageResult,
} from "@/lib/ai/schema";
import {
  TRIAGE_SYSTEM_PROMPT,
  TRIAGE_TOOL_DESCRIPTION,
  TRIAGE_TOOL_NAME,
  buildTriageUserMessage,
} from "@/lib/ai/prompts";
import { runStructuredCall, type ToolInputValidation } from "@/lib/ai/structured-call";

const TRIAGE_MAX_TOKENS = 2_000;

const AI_NOT_CONFIGURED_MESSAGE =
  "AI triage is not configured (ANTHROPIC_API_KEY is not set); the request can be triaged later.";

function buildTriageInputSchema(): Anthropic.Tool.InputSchema {
  const schema = z.toJSONSchema(triageResultSchema);
  // The draft URI is metadata the tool definition does not need.
  delete schema.$schema;
  // The one sanctioned assertion: z.toJSONSchema returns a generic JSON Schema type,
  // while the SDK wants its own InputSchema shape. A z.object always serializes to
  // { type: "object", properties, required }, which is exactly that shape.
  return schema as Anthropic.Tool.InputSchema;
}

const TRIAGE_TOOL: Anthropic.Tool = {
  name: TRIAGE_TOOL_NAME,
  description: TRIAGE_TOOL_DESCRIPTION,
  input_schema: buildTriageInputSchema(),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Drops judgments for ids the model was never shown (and repeated ids) instead of
 * failing the whole triage: an invented id is noise, the rest of the analysis is sound.
 */
function keepProvidedCandidates(raw: unknown, candidateIds: ReadonlySet<number>): unknown {
  if (!isRecord(raw) || !Array.isArray(raw.duplicates)) {
    return raw;
  }
  const seen = new Set<number>();
  const duplicates = raw.duplicates.filter((judgment: unknown) => {
    if (!isRecord(judgment) || typeof judgment.candidateId !== "number") {
      return true; // leave malformed entries for the schema to reject with a useful message
    }
    if (!candidateIds.has(judgment.candidateId) || seen.has(judgment.candidateId)) {
      return false;
    }
    seen.add(judgment.candidateId);
    return true;
  });
  return { ...raw, duplicates };
}

function validateTriage(raw: unknown, input: TriageInput): ToolInputValidation<TriageResult> {
  const candidateIds = new Set(input.candidates.map((candidate) => candidate.id));
  const parsed = triageResultSchema.safeParse(keepProvidedCandidates(raw, candidateIds));
  if (!parsed.success) {
    return { ok: false, issues: z.prettifyError(parsed.error) };
  }
  const { theme } = parsed.data;
  if (theme.kind === "existing" && !input.themes.some((known) => known.id === theme.themeId)) {
    const knownIds = input.themes.map((known) => known.id).join(", ") || "none";
    return {
      ok: false,
      issues: `theme.themeId ${theme.themeId} is not one of the provided theme ids (${knownIds}). Use a provided id, or kind "new" or "none".`,
    };
  }
  return { ok: true, value: parsed.data };
}

export async function triageRequest(
  input: TriageInput,
  log: AiCallLogger,
): Promise<TriageOutcome> {
  if (!isAiConfigured()) {
    return { ok: false, code: "ai_unavailable", message: AI_NOT_CONFIGURED_MESSAGE };
  }
  const result = await runStructuredCall({
    stage: "triage",
    system: TRIAGE_SYSTEM_PROMPT,
    userMessage: buildTriageUserMessage(input),
    tool: TRIAGE_TOOL,
    maxTokens: TRIAGE_MAX_TOKENS,
    validate: (raw) => validateTriage(raw, input),
    log,
  });
  if (!result.ok) {
    return result;
  }
  return { ok: true, result: result.value };
}
