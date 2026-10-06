import Link from "next/link";
import type { ReactElement } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatConfidence } from "@/components/ui/format";
import { cardClass, focusRing } from "@/components/ui/styles";
import type { RequestDetailResponse, RequestWithMeta } from "@/lib/types";

type DetailLink = RequestDetailResponse["links"][number];

function duplicateLabel(request: RequestWithMeta, link: DetailLink): string {
  if (request.canonicalRequestId === link.otherId) return "Consolidated into";
  // Link direction is not canonical-aware, so infer from this request's own state:
  // a request that is not itself merged is the canonical side of the pair.
  return request.status === "merged" ? "Duplicate of" : "Consolidates";
}

function LinkRow(props: { label: string; link: DetailLink }): ReactElement {
  return (
    <li>
      <Link
        href={`/requests/${props.link.otherId}`}
        className={`flex flex-col gap-1 rounded-lg border border-line px-3 py-2.5 transition-colors hover:border-accent/40 hover:bg-accent-soft/40 sm:flex-row sm:items-center sm:justify-between ${focusRing}`}
      >
        <span className="min-w-0">
          <span className="block text-xs text-muted">{props.label}</span>
          <span className="block truncate text-sm font-medium text-fg">{props.link.otherTitle}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge tone="neutral" title="How confident the AI (or reviewer) was in this link">
            {formatConfidence(props.link.confidence)} confidence
          </Badge>
          <Badge tone={props.link.decidedBy === "human" ? "success" : "accent"}>
            {props.link.decidedBy === "human" ? "Human-approved" : "AI-linked"}
          </Badge>
        </span>
      </Link>
    </li>
  );
}

export function LinksSection(props: { request: RequestWithMeta; links: DetailLink[] }): ReactElement {
  const duplicates = props.links.filter((link) => link.kind === "duplicate");
  const related = props.links.filter((link) => link.kind === "related");

  return (
    <section aria-labelledby="links-heading" className={`${cardClass} p-5`}>
      <h2 id="links-heading" className="text-sm font-semibold text-fg">
        Connected requests
      </h2>
      {props.links.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          The AI found no duplicates or closely related requests. This looks like a distinct need.
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {duplicates.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Merged</h3>
              <ul className="space-y-2">
                {duplicates.map((link) => (
                  <LinkRow
                    key={`${link.requestId}-${link.relatedRequestId}`}
                    label={duplicateLabel(props.request, link)}
                    link={link}
                  />
                ))}
              </ul>
            </div>
          ) : null}
          {related.length > 0 ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Related</h3>
              <ul className="space-y-2">
                {related.map((link) => (
                  <LinkRow key={`${link.requestId}-${link.relatedRequestId}`} label="Related to" link={link} />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
