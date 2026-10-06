import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { isAiConfigured } from "@/lib/config";
import type { AiCallLogger, BriefInput, BriefOutcome } from "@/lib/ai/schema";
import {
  BRIEF_SECTION_HEADINGS,
  BRIEF_SYSTEM_PROMPT,
  BRIEF_TOOL_DESCRIPTION,
  BRIEF_TOOL_NAME,
  PROMPT_VERSION,
  buildBriefUserMessage,
} from "@/lib/ai/prompts";
import { runStructuredCall, type ToolInputValidation } from "@/lib/ai/structured-call";

const BRIEF_MAX_TOKENS = 1_500;
const BRIEF_MIN_CHARS = 200;
// Upper bound well above what 1500 output tokens can produce; guards the stored column.
const BRIEF_MAX_CHARS = 20_000;

const AI_NOT_CONFIGURED_MESSAGE =
  "Brief generation is not configured (ANTHROPIC_API_KEY is not set).";

const briefOutputSchema = z.object({
  contentMd: z.string().min(BRIEF_MIN_CHARS).max(BRIEF_MAX_CHARS),
});

type BriefOutput = z.infer<typeof briefOutputSchema>;

// Hand-written rather than generated: the schema is one field and the length bounds
// are enforced client-side by zod, so the tool definition needs no assertion.
const BRIEF_TOOL: Anthropic.Tool = {
  name: BRIEF_TOOL_NAME,
  description: BRIEF_TOOL_DESCRIPTION,
  input_schema: {
    type: "object",
    properties: {
      contentMd: {
        type: "string",
        description: `The complete decision brief in markdown, with the sections ${BRIEF_SECTION_HEADINGS.join(", ")}.`,
      },
    },
    required: ["contentMd"],
    additionalProperties: false,
  },
};

function missingHeadings(contentMd: string): string[] {
  const lines = new Set(contentMd.split("\n").map((line) => line.trim()));
  return BRIEF_SECTION_HEADINGS.filter((heading) => !lines.has(heading));
}

function validateBrief(raw: unknown): ToolInputValidation<BriefOutput> {
  const parsed = briefOutputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: z.prettifyError(parsed.error) };
  }
  const missing = missingHeadings(parsed.data.contentMd);
  if (missing.length > 0) {
    return {
      ok: false,
      issues: `contentMd is missing these required headings, each on its own line: ${missing.join("; ")}.`,
    };
  }
  return { ok: true, value: parsed.data };
}

export async function generateBrief(input: BriefInput, log: AiCallLogger): Promise<BriefOutcome> {
  if (!isAiConfigured()) {
    return { ok: false, code: "ai_unavailable", message: AI_NOT_CONFIGURED_MESSAGE };
  }
  const result = await runStructuredCall({
    stage: "brief",
    system: BRIEF_SYSTEM_PROMPT,
    userMessage: buildBriefUserMessage(input),
    tool: BRIEF_TOOL,
    maxTokens: BRIEF_MAX_TOKENS,
    validate: validateBrief,
    log,
  });
  if (!result.ok) {
    return result;
  }
  return {
    ok: true,
    contentMd: result.value.contentMd,
    model: result.model,
    promptVersion: PROMPT_VERSION,
  };
}
