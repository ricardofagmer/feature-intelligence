/**
 * Business configuration for the triage pipeline. In production this would be
 * per-workspace settings; for this exercise it is the single team's config.
 */

export const ANTHROPIC_MODEL = "claude-sonnet-5-5";

/** Duplicate proposals at or above this confidence are auto-linked. */
export const AUTO_MERGE_CONFIDENCE = 0.85;

/** Duplicate proposals between this and AUTO_MERGE_CONFIDENCE go to the human review queue; below, ignored. */
export const REVIEW_MIN_CONFIDENCE = 0.6;

/** Max FTS candidates handed to the model for duplicate judgment. */
export const DEDUPE_CANDIDATE_LIMIT = 8;

/** Stated product goals the prioritization stage scores strategic fit against. */
export const PRODUCT_GOALS: readonly string[] = [
  "Grow self-serve adoption: reduce friction for new teams onboarding without sales involvement",
  "Win mid-market deals: close the reporting and permissions gaps that block 50-500 seat prospects",
  "Reduce support load: eliminate the top recurring sources of support tickets",
];

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
