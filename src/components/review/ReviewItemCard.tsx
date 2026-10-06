import Link from "next/link";
import type { ReactElement } from "react";
import { ReviewActions } from "@/components/review/ReviewActions";
import { ReviewKindBadge } from "@/components/review/ReviewKindBadge";
import { formatConfidence } from "@/components/ui/format";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { cardClass, linkClass } from "@/components/ui/styles";
import type { MergeProposal, NewThemeProposal, ReviewItem } from "@/lib/types";

function MergeDetails(props: { proposal: MergeProposal }): ReactElement {
  const percent = Math.round(Math.min(1, Math.max(0, props.proposal.confidence)) * 100);
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-lg border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted">Possibly the same need as</p>
          <Link href={`/requests/${props.proposal.targetRequestId}`} className={`text-sm font-medium ${linkClass}`}>
            {props.proposal.targetRequestTitle}
          </Link>
        </div>
        <div className="w-full shrink-0 sm:w-40">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted">AI confidence</span>
            <span className="font-semibold tabular-nums text-fg">{formatConfidence(props.proposal.confidence)}</span>
          </div>
          <div
            role="meter"
            aria-label="AI confidence"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted"
          >
            <div className="h-full rounded-full bg-warning" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
      <blockquote className="border-l-2 border-accent pl-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">AI reasoning</p>
        <p className="mt-1 text-sm leading-relaxed text-fg">{props.proposal.reasoning}</p>
      </blockquote>
    </div>
  );
}

function NewThemeDetails(props: { proposal: NewThemeProposal }): ReactElement {
  return (
    <div className="rounded-lg border border-line p-3">
      <p className="text-xs text-muted">Proposed theme</p>
      <p className="mt-0.5 text-sm font-semibold text-fg">{props.proposal.name}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{props.proposal.summary}</p>
    </div>
  );
}

export function ReviewItemCard(props: { item: ReviewItem }): ReactElement {
  const { item } = props;
  const subject = item.payload.kind === "merge" ? item.requestTitle : item.payload.name;
  return (
    <article className={`${cardClass} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ReviewKindBadge kind={item.kind} />
        <p className="text-xs text-muted">
          Flagged <RelativeTime value={item.createdAt} />
        </p>
      </div>
      <h2 className="mt-3 text-base font-semibold leading-snug text-fg">
        <Link href={`/requests/${item.requestId}`} className={linkClass}>
          {item.requestTitle}
        </Link>
      </h2>
      <div className="mt-3">
        {item.payload.kind === "merge" ? (
          <MergeDetails proposal={item.payload} />
        ) : (
          <NewThemeDetails proposal={item.payload} />
        )}
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <ReviewActions itemId={item.id} kind={item.kind} subject={subject} />
      </div>
    </article>
  );
}
