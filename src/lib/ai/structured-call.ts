import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_MODEL } from "@/lib/config";
import type { AiCallLog } from "@/lib/types";
import type { AiCallLogger } from "@/lib/ai/schema";
import { getAnthropicClient } from "@/lib/ai/client";
import {
  PROMPT_VERSION,
  buildInvalidToolInputFeedback,
  buildMissingToolCallFeedback,
} from "@/lib/ai/prompts";

export type ToolInputValidation<T> = { ok: true; value: T } | { ok: false; issues: string };

export type StructuredCallResult<T> =
  | { ok: true; value: T; model: string }
  | { ok: false; code: "ai_unavailable" | "invalid_output"; message: string };

export interface StructuredCallOptions<T> {
  stage: AiCallLog["stage"];
  system: string;
  userMessage: string;
  tool: Anthropic.Tool;
  maxTokens: number;
  validate: (input: unknown) => ToolInputValidation<T>;
  log: AiCallLogger;
}

/** First call plus exactly one corrective retry carrying the validation error. */
const MAX_ATTEMPTS = 2;
const MAX_FEEDBACK_CHARS = 2_000;

export const AI_UNAVAILABLE_MESSAGE = "The AI service is unavailable right now.";
const INVALID_OUTPUT_MESSAGE = "The AI returned output that failed validation twice.";

type AttemptResult<T> =
  | { kind: "valid"; value: T; model: string }
  | { kind: "invalid"; response: Anthropic.Message; toolUseIds: string[]; feedback: string }
  | { kind: "unavailable" };

function findToolUses(response: Anthropic.Message): Anthropic.ToolUseBlock[] {
  return response.content.filter(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
}

function evaluateResponse<T>(
  response: Anthropic.Message,
  options: StructuredCallOptions<T>,
): AttemptResult<T> {
  const truncated = response.stop_reason === "max_tokens";
  const toolUses = findToolUses(response);
  const toolUseIds = toolUses.map((block) => block.id);
  const call = toolUses.find((block) => block.name === options.tool.name);
  if (call === undefined) {
    return {
      kind: "invalid",
      response,
      toolUseIds,
      feedback: buildMissingToolCallFeedback(options.tool.name, truncated),
    };
  }
  const validation = options.validate(call.input);
  if (validation.ok) {
    return { kind: "valid", value: validation.value, model: response.model };
  }
  return {
    kind: "invalid",
    response,
    toolUseIds,
    feedback: buildInvalidToolInputFeedback(
      options.tool.name,
      validation.issues.slice(0, MAX_FEEDBACK_CHARS),
      truncated,
    ),
  };
}

async function attemptCall<T>(
  options: StructuredCallOptions<T>,
  messages: Anthropic.MessageParam[],
): Promise<AttemptResult<T>> {
  const startedAt = performance.now();
  let model = ANTHROPIC_MODEL;
  let inputTokens = 0;
  let outputTokens = 0;
  let outcome: AiCallLog["outcome"] = "error";
  try {
    const response = await getAnthropicClient().messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: options.maxTokens,
      system: options.system,
      messages,
      tools: [options.tool],
      // claude-sonnet-5-5 rejects forced tool_choice ("tool"/"any") with a 400, so the
      // prompt names the tool and a missing call goes through the validation retry.
      tool_choice: { type: "auto", disable_parallel_tool_use: true },
      // Adaptive thinking would spend the fixed max_tokens budget before the tool input
      // is written; the per-field reasoning in the schema carries the analysis instead.
      thinking: { type: "between_tools" },
    });
    model = response.model;
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
    const result = evaluateResponse(response, options);
    outcome = result.kind === "valid" ? "ok" : "invalid_output";
    return result;
  } catch (error) {
    // SDK errors (HTTP status, connection, timeout) become a typed outcome; anything
    // else is a programming error and must surface rather than read as an outage.
    if (error instanceof Anthropic.AnthropicError) {
      return { kind: "unavailable" };
    }
    throw error;
  } finally {
    // Logged on every path, including timeouts, so failed calls stay visible in cost and
    // latency data. Prompt contents are deliberately never part of the log record.
    options.log({
      stage: options.stage,
      model,
      promptVersion: PROMPT_VERSION,
      latencyMs: Math.round(performance.now() - startedAt),
      inputTokens,
      outputTokens,
      outcome,
    });
  }
}

/**
 * Appends the rejected turn and the feedback instead of rewriting history, which keeps
 * the conversation valid for models that bind content blocks to the prefix.
 */
function withFeedback(
  messages: Anthropic.MessageParam[],
  rejected: Extract<AttemptResult<unknown>, { kind: "invalid" }>,
): Anthropic.MessageParam[] {
  if (rejected.response.content.length === 0) {
    return [...messages, { role: "user", content: rejected.feedback }];
  }
  const assistantTurn: Anthropic.MessageParam = {
    role: "assistant",
    content: rejected.response.content,
  };
  if (rejected.toolUseIds.length === 0) {
    return [...messages, assistantTurn, { role: "user", content: rejected.feedback }];
  }
  // Every tool_use block needs a matching tool_result, or the API rejects the next turn.
  const toolResults: Anthropic.ToolResultBlockParam[] = rejected.toolUseIds.map((id) => ({
    type: "tool_result",
    tool_use_id: id,
    is_error: true,
    content: rejected.feedback,
  }));
  return [...messages, assistantTurn, { role: "user", content: toolResults }];
}

/**
 * One structured model call with schema validation and a single corrective retry.
 * Never throws for upstream or validation failures; those become typed results.
 */
export async function runStructuredCall<T>(
  options: StructuredCallOptions<T>,
): Promise<StructuredCallResult<T>> {
  let messages: Anthropic.MessageParam[] = [{ role: "user", content: options.userMessage }];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await attemptCall(options, messages);
    if (result.kind === "unavailable") {
      return { ok: false, code: "ai_unavailable", message: AI_UNAVAILABLE_MESSAGE };
    }
    if (result.kind === "valid") {
      return { ok: true, value: result.value, model: result.model };
    }
    messages = withFeedback(messages, result);
  }
  return { ok: false, code: "invalid_output", message: INVALID_OUTPUT_MESSAGE };
}
