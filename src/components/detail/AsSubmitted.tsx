import type { ReactElement } from "react";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { cardClass } from "@/components/ui/styles";
import type { FeatureRequest } from "@/lib/types";

/** The requester's own words, verbatim, kept visually apart from the AI interpretation. */
export function AsSubmitted(props: { request: FeatureRequest }): ReactElement {
  return (
    <section aria-labelledby="as-submitted-heading" className={`${cardClass} p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="as-submitted-heading" className="text-xs font-semibold uppercase tracking-wide text-muted">
          As submitted
        </h2>
        <p className="text-xs text-muted">
          by <span className="font-medium text-fg">{props.request.requester || "Anonymous"}</span>{" "}
          <span aria-hidden>·</span> <RelativeTime value={props.request.createdAt} />
        </p>
      </div>
      <p className="mt-3 text-base font-medium text-fg">{props.request.title}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">
        {props.request.description}
      </p>
    </section>
  );
}
