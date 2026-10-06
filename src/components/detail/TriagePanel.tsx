import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { RetriageButton } from "@/components/detail/RetriageButton";
import { Badge } from "@/components/ui/Badge";
import { SparkIcon } from "@/components/ui/Icons";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { priorityTier, type PriorityTier } from "@/components/ui/format";
import { cardClass, linkClass } from "@/components/ui/styles";
import type { RequestWithMeta, Theme } from "@/lib/types";

const meterTone: Record<PriorityTier, string> = { high: "bg-success", mid: "bg-warning", low: "bg-subtle" };

function Field(props: { label: string; children: ReactNode }): ReactElement {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{props.label}</dt>
      <dd className="mt-0.5 text-sm text-fg">{props.children}</dd>
    </div>
  );
}

function PendingTriage(props: { requestId: number }): ReactElement {
  return (
    <section aria-labelledby="triage-heading" className="rounded-xl border border-warning/30 bg-warning-soft p-5">
      <h2 id="triage-heading" className="text-sm font-semibold text-warning">
        AI triage pending
      </h2>
      <p className="mt-1 text-sm text-fg">
        The AI could not analyze this request when it was submitted (service unavailable or not configured). The
        request is safe and visible on the board; re-run triage to get its underlying need, theme and priority.
      </p>
      <div className="mt-4">
        <RetriageButton requestId={props.requestId} />
      </div>
    </section>
  );
}

export function TriagePanel(props: { request: RequestWithMeta; theme: Theme | null }): ReactElement {
  const { request, theme } = props;
  if (request.status === "pending_triage" || request.status === "new") {
    return <PendingTriage requestId={request.id} />;
  }
  const score = request.priorityScore === null ? null : Math.round(request.priorityScore);

  return (
    <section aria-labelledby="triage-heading" className={`${cardClass} overflow-hidden`}>
      <div className="flex items-center justify-between gap-2 border-b border-line bg-accent-soft/50 px-5 py-3">
        <h2 id="triage-heading" className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
          <SparkIcon />
          AI triage
        </h2>
        {request.triagedAt ? (
          <p className="text-xs text-muted">
            <RelativeTime value={request.triagedAt} />
          </p>
        ) : null}
      </div>

      <div className="space-y-5 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Underlying need</p>
          <p className="mt-1 text-base leading-relaxed text-fg">
            {request.problemStatement ?? "The AI did not extract an underlying need for this request."}
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Persona">{request.persona ?? "Not identified"}</Field>
          <Field label="Product area">{request.productArea ?? "Not identified"}</Field>
          <Field label="Theme">
            {theme ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <Link href={`/themes#theme-${theme.id}`} className={linkClass}>
                  {theme.name}
                </Link>
                {theme.status === "proposed" ? <Badge tone="warning">Proposed</Badge> : null}
              </span>
            ) : (
              "Unassigned"
            )}
          </Field>
          <Field label="Support">{request.supportCount} including merged duplicates</Field>
        </dl>

        <div className="rounded-lg border border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-fg">Priority score</p>
            <PriorityBadge score={score} />
          </div>
          {score !== null ? (
            <div
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
              role="meter"
              aria-label="Priority score"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score}
            >
              <div className={`h-full rounded-full ${meterTone[priorityTier(score)]}`} style={{ width: `${score}%` }} />
            </div>
          ) : null}
          <p className="mt-3 text-sm leading-relaxed text-fg">
            {request.priorityRationale ?? "No rationale was recorded for this score."}
          </p>
          <p className="mt-2 text-xs text-muted">
            Advisory: scored on demand, strategic fit with product goals, effort and risk. Product managers make the
            final call.
          </p>
        </div>
      </div>
    </section>
  );
}
