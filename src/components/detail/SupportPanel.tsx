"use client";

import type { ReactElement } from "react";
import { NameForm } from "@/components/votes/NameForm";
import { useVote } from "@/components/votes/useVote";
import { ArrowUpIcon, CheckIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { pluralize } from "@/components/ui/format";
import { buttonClass, cardClass } from "@/components/ui/styles";

const VISIBLE_VOTERS = 24;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SupportPanel(props: {
  requestId: number;
  supportCount: number;
  duplicateCount: number;
  voters: string[];
}): ReactElement {
  const vote = useVote({ requestId: props.requestId, supportCount: props.supportCount, voters: props.voters });
  const pending = vote.phase.kind === "pending";
  const hiddenVoters = Math.max(0, props.voters.length - VISIBLE_VOTERS);

  return (
    <section aria-labelledby="support-heading" className={`${cardClass} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="support-heading" className="text-sm font-semibold text-fg">
            Support
          </h2>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-fg">{vote.displayCount}</p>
          <p className="text-xs text-muted">
            {props.duplicateCount > 0
              ? `Includes support from ${pluralize(props.duplicateCount, "merged duplicate")}`
              : "People who need this"}
          </p>
        </div>
        <button
          type="button"
          onClick={vote.start}
          disabled={pending || vote.hasVoted}
          aria-pressed={vote.hasVoted}
          className={buttonClass({ variant: vote.hasVoted ? "secondary" : "primary" })}
        >
          {pending ? <Spinner /> : vote.hasVoted ? <CheckIcon /> : <ArrowUpIcon />}
          {vote.hasVoted ? "You support this" : "I need this too"}
        </button>
      </div>

      {vote.phase.kind === "askingName" ? (
        <div className="mt-4 rounded-lg border border-line bg-surface-muted/50 p-3">
          <NameForm idPrefix="detail-vote" onSubmit={vote.submitName} onCancel={vote.cancel} />
        </div>
      ) : null}

      <div aria-live="polite">
        {vote.phase.kind === "voted" && vote.phase.note ? (
          <p className="mt-3 text-sm text-muted">{vote.phase.note}</p>
        ) : null}
        {vote.phase.kind === "error" ? <p className="mt-3 text-sm text-danger">{vote.phase.message}</p> : null}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Direct supporters ({props.voters.length})
        </h3>
        {props.voters.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No votes on this request yet. Be the first to add your support.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {props.voters.slice(0, VISIBLE_VOTERS).map((voter) => (
              <li
                key={voter}
                className={`inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs ${
                  voter === vote.storedName ? "border-accent/40 bg-accent-soft text-accent" : "border-line text-fg"
                }`}
              >
                <span
                  aria-hidden
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-[10px] font-semibold text-muted"
                >
                  {initials(voter)}
                </span>
                {voter}
              </li>
            ))}
            {hiddenVoters > 0 ? <li className="self-center text-xs text-muted">and {hiddenVoters} more</li> : null}
          </ul>
        )}
      </div>
    </section>
  );
}
