import Anthropic from "@anthropic-ai/sdk";

/** Triage runs inline on submission, so a hung upstream must not hold the request open. */
const REQUEST_TIMEOUT_MS = 45_000;

/** One SDK-level retry (with its built-in backoff) for 429/5xx/connection errors; validation retries are separate. */
const MAX_RETRIES = 1;

let anthropicClient: Anthropic | null = null;

/**
 * Lazy so that importing the AI module never requires a key: callers check
 * isAiConfigured() first, and the SDK reads ANTHROPIC_API_KEY from the
 * environment itself, so the key never travels through application code.
 */
export function getAnthropicClient(): Anthropic {
  if (anthropicClient === null) {
    anthropicClient = new Anthropic({
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    });
  }
  return anthropicClient;
}
