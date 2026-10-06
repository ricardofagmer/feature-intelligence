import type { ReactElement } from "react";
import { priorityTier, type PriorityTier } from "@/components/ui/format";

const tierClasses: Record<PriorityTier, string> = {
  high: "bg-success-soft text-success ring-success/25",
  mid: "bg-warning-soft text-warning ring-warning/25",
  low: "bg-neutral-soft text-muted ring-line-strong",
};

const tierLabels: Record<PriorityTier, string> = {
  high: "High priority",
  mid: "Medium priority",
  low: "Low priority",
};

/** AI priority score pill; the rationale rides on the title attribute for a hover read. */
export function PriorityBadge(props: { score: number | null; rationale?: string | null }): ReactElement {
  if (props.score === null) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-neutral-soft px-2 py-0.5 text-xs font-medium text-muted"
        title="Not scored yet"
      >
        Unscored
      </span>
    );
  }
  const score = Math.round(props.score);
  const tier = priorityTier(score);
  const title = props.rationale ? `${tierLabels[tier]}: ${props.rationale}` : tierLabels[tier];
  return (
    <span
      title={title}
      aria-label={`${tierLabels[tier]}, AI score ${score} out of 100`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${tierClasses[tier]}`}
    >
      <span aria-hidden className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        Priority
      </span>
      <span aria-hidden>{score}</span>
    </span>
  );
}
