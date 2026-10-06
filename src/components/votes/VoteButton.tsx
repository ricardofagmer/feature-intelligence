"use client";

import { useRef, type ReactElement } from "react";
import { NameForm } from "@/components/votes/NameForm";
import { useVote } from "@/components/votes/useVote";
import { ArrowUpIcon, CheckIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { focusRing } from "@/components/ui/styles";

/** Compact vertical upvote control for request cards on the board. */
export function VoteButton(props: { requestId: number; supportCount: number; title: string }): ReactElement {
  const vote = useVote({ requestId: props.requestId, supportCount: props.supportCount });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pending = vote.phase.kind === "pending";

  function closeForm(): void {
    vote.cancel();
    buttonRef.current?.focus();
  }

  const label = vote.hasVoted
    ? `You support "${props.title}". ${vote.displayCount} supporters.`
    : `Support "${props.title}". ${vote.displayCount} supporters.`;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={vote.start}
        disabled={pending}
        aria-label={label}
        aria-pressed={vote.hasVoted}
        aria-expanded={vote.phase.kind === "askingName" ? true : undefined}
        className={`flex h-16 w-14 flex-col items-center justify-center gap-0.5 rounded-lg border text-sm font-semibold tabular-nums transition-colors disabled:cursor-wait ${focusRing} ${
          vote.hasVoted
            ? "border-accent/40 bg-accent-soft text-accent"
            : "border-line-strong bg-surface text-fg hover:border-accent/50 hover:bg-accent-soft hover:text-accent"
        }`}
      >
        {pending ? <Spinner /> : vote.hasVoted ? <CheckIcon /> : <ArrowUpIcon />}
        <span>{vote.displayCount}</span>
      </button>

      {vote.phase.kind === "askingName" ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-line bg-surface p-3 shadow-lg shadow-black/5">
          <NameForm idPrefix={`vote-${props.requestId}`} onSubmit={vote.submitName} onCancel={closeForm} />
        </div>
      ) : null}

      <div aria-live="polite" className="sr-only">
        {vote.phase.kind === "voted" ? (vote.phase.note ?? "Your support was recorded.") : ""}
      </div>
      {vote.phase.kind === "error" ? (
        <p role="alert" className="absolute left-0 top-full z-10 mt-2 w-56 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
          {vote.phase.message}
        </p>
      ) : null}
    </div>
  );
}
