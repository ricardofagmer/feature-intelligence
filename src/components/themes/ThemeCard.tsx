import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { BriefSection } from "@/components/themes/BriefSection";
import { Badge } from "@/components/ui/Badge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { cardClass, focusRing, linkClass } from "@/components/ui/styles";
import type { Brief, ThemeWithStats } from "@/lib/types";

function Stat(props: { label: string; children: ReactNode }): ReactElement {
  return (
    <div className="rounded-lg bg-surface-muted/60 px-3 py-2">
      <dt className="text-xs text-muted">{props.label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg">{props.children}</dd>
    </div>
  );
}

export function ThemeCard(props: { theme: ThemeWithStats; latestBrief: Brief | null }): ReactElement {
  const { theme } = props;
  const headingId = `theme-${theme.id}-name`;
  return (
    <article id={`theme-${theme.id}`} aria-labelledby={headingId} className={`${cardClass} scroll-mt-20`}>
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 id={headingId} className="min-w-0 text-lg font-semibold tracking-tight text-fg">
            {theme.name}
          </h2>
          {theme.status === "confirmed" ? (
            <Badge tone="success">Confirmed</Badge>
          ) : (
            <Link href="/review" className={`rounded-full ${focusRing}`} aria-label="Proposed theme, awaiting PM review. Open the review queue.">
              <Badge tone="warning">Proposed: awaiting PM review</Badge>
            </Link>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{theme.summary}</p>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Requests">{theme.requestCount}</Stat>
          <Stat label="Total support">{theme.totalSupport}</Stat>
          <Stat label="Avg priority">
            {theme.avgPriorityScore === null ? (
              <span className="text-sm font-normal text-muted">None yet</span>
            ) : (
              <PriorityBadge score={theme.avgPriorityScore} />
            )}
          </Stat>
        </dl>

        {theme.topRequestTitles.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Top requests</h3>
            <ol className="mt-2 space-y-1.5">
              {theme.topRequestTitles.map((title, index) => (
                <li key={`${index}-${title}`} className="flex gap-2 text-sm text-fg">
                  <span aria-hidden className="w-4 shrink-0 text-right tabular-nums text-subtle">
                    {index + 1}
                  </span>
                  <span className="min-w-0">{title}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">No requests are assigned to this theme yet.</p>
        )}

        <Link href={`/?theme=${theme.id}`} className={`mt-4 inline-block text-sm font-medium ${linkClass}`}>
          See all {theme.requestCount} on the board
        </Link>
      </div>

      <div className="border-t border-line p-5">
        <BriefSection themeId={theme.id} themeName={theme.name} initialBrief={props.latestBrief} />
      </div>
    </article>
  );
}
