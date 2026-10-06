/** Pure formatting helpers shared by server and client components. */

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const absoluteFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export function parseTimestamp(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelative(value: string, now: Date = new Date()): string {
  const date = parseTimestamp(value);
  if (!date) return "unknown date";
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < MINUTE) return "just now";
  if (abs < HOUR) return relativeFormatter.format(Math.round(seconds / MINUTE), "minute");
  if (abs < DAY) return relativeFormatter.format(Math.round(seconds / HOUR), "hour");
  if (abs < WEEK) return relativeFormatter.format(Math.round(seconds / DAY), "day");
  if (abs < MONTH) return relativeFormatter.format(Math.round(seconds / WEEK), "week");
  if (abs < YEAR) return relativeFormatter.format(Math.round(seconds / MONTH), "month");
  return relativeFormatter.format(Math.round(seconds / YEAR), "year");
}

export function formatAbsolute(value: string): string {
  const date = parseTimestamp(value);
  return date ? absoluteFormatter.format(date) : value;
}

/** Confidence arrives as 0..1; clamp so a malformed value never renders as 340%. */
export function formatConfidence(confidence: number): string {
  const clamped = Math.min(1, Math.max(0, confidence));
  return `${Math.round(clamped * 100)}%`;
}

export type PriorityTier = "high" | "mid" | "low";

export const HIGH_PRIORITY_MIN = 70;
export const MID_PRIORITY_MIN = 40;

export function priorityTier(score: number): PriorityTier {
  if (score >= HIGH_PRIORITY_MIN) return "high";
  if (score >= MID_PRIORITY_MIN) return "mid";
  return "low";
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
