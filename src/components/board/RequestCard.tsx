import Link from "next/link";
import type { ReactElement } from "react";
import { PriorityRationale } from "@/components/board/PriorityRationale";
import { Badge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { focusRing } from "@/components/ui/styles";
import { VoteButton } from "@/components/votes/VoteButton";
import type { RequestWithMeta } from "@/lib/types";

export function RequestCard(props: { request: RequestWithMeta }): ReactElement {
  const { request } = props;
  return (
    <article className="group rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <VoteButton requestId={request.id} supportCount={request.supportCount} title={request.title} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <h3 className="min-w-0 text-base font-semibold leading-snug text-fg">
              <Link href={`/requests/${request.id}`} className={`rounded hover:text-accent ${focusRing}`}>
                {request.title}
              </Link>
            </h3>
            <PriorityBadge score={request.priorityScore} rationale={request.priorityRationale} />
          </div>

          <p className="mt-1 text-xs text-muted">
            {request.requester || "Anonymous"} <span aria-hidden>·</span> <RelativeTime value={request.createdAt} />
          </p>

          {request.problemStatement ? (
            <div className="mt-3 rounded-lg border-l-2 border-accent bg-accent-soft/60 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Underlying need</p>
              <p className="mt-0.5 text-sm text-fg">{request.problemStatement}</p>
            </div>
          ) : request.status === "pending_triage" ? (
            <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
              AI triage has not run yet for this request. It is queued and can be re-run from the detail page.
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            {request.themeId !== null && request.themeName ? (
              <Link
                href={`/?theme=${request.themeId}`}
                className={`inline-flex items-center rounded-full border border-line px-2 py-0.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent ${focusRing}`}
                aria-label={`Show requests in theme ${request.themeName}`}
              >
                {request.themeName}
              </Link>
            ) : null}
            {request.duplicateCount > 0 ? (
              <Badge tone="neutral" title="Duplicate requests consolidated into this one; their support counts here">
                {request.duplicateCount} merged
              </Badge>
            ) : null}
            {request.productArea ? <span className="text-xs text-subtle">{request.productArea}</span> : null}
          </div>

          {request.priorityRationale && request.priorityScore !== null ? (
            <PriorityRationale score={Math.round(request.priorityScore)} rationale={request.priorityRationale} />
          ) : null}
        </div>
      </div>
    </article>
  );
}
