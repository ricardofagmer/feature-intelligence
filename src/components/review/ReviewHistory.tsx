import Link from "next/link";
import type { ReactElement } from "react";
import { ReviewKindBadge } from "@/components/review/ReviewKindBadge";
import { Badge } from "@/components/ui/Badge";
import { ChevronDownIcon } from "@/components/ui/Icons";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { cardClass, focusRing, linkClass } from "@/components/ui/styles";
import type { ReviewItem } from "@/lib/types";

function describe(item: ReviewItem): string {
  return item.payload.kind === "merge"
    ? `Merge into "${item.payload.targetRequestTitle}"`
    : `Theme "${item.payload.name}"`;
}

export function ReviewHistory(props: { items: ReviewItem[] }): ReactElement {
  return (
    <details className={`${cardClass} group`}>
      <summary
        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-5 py-4 text-sm font-semibold text-fg ${focusRing}`}
      >
        <span>
          History <span className="font-normal text-muted">({props.items.length} decided)</span>
        </span>
        <ChevronDownIcon className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <ul className="divide-y divide-line border-t border-line">
        {props.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <ReviewKindBadge kind={item.kind} />
                <Link href={`/requests/${item.requestId}`} className={`truncate text-sm font-medium ${linkClass}`}>
                  {item.requestTitle}
                </Link>
              </div>
              <p className="text-xs text-muted">{describe(item)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted">
              <Badge tone={item.status === "approved" ? "success" : "neutral"}>
                {item.status === "approved" ? "Approved" : "Rejected"}
              </Badge>
              {item.resolvedAt ? <RelativeTime value={item.resolvedAt} /> : null}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
