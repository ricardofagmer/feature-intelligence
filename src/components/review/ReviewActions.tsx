"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { CheckIcon, CloseIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { buttonClass } from "@/components/ui/styles";
import { ApiRequestError, describeApiError, resolveReviewItem } from "@/lib/clientApi";
import type { ReviewActionBody, ReviewKind } from "@/lib/types";

type Action = ReviewActionBody["action"];
type ActionPhase = { kind: "idle" } | { kind: "pending"; action: Action } | { kind: "error"; message: string };

const approveLabel: Record<ReviewKind, string> = {
  merge: "Approve merge",
  new_theme: "Approve theme",
};

const rejectLabel: Record<ReviewKind, string> = {
  merge: "Keep separate",
  new_theme: "Reject theme",
};

export function ReviewActions(props: { itemId: number; kind: ReviewKind; subject: string }): ReactElement {
  const router = useRouter();
  const [phase, setPhase] = useState<ActionPhase>({ kind: "idle" });
  const busy = phase.kind === "pending";

  async function resolve(action: Action): Promise<void> {
    setPhase({ kind: "pending", action });
    try {
      await resolveReviewItem(props.itemId, action);
      router.refresh();
    } catch (error) {
      // Someone else already decided this item: show the current state instead of an error.
      if (error instanceof ApiRequestError && error.code === "conflict") {
        router.refresh();
        return;
      }
      setPhase({ kind: "error", message: describeApiError(error, "The decision could not be saved. Try again.") });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void resolve("approve")}
          disabled={busy}
          aria-label={`${approveLabel[props.kind]}: ${props.subject}`}
          className={buttonClass({ size: "sm" })}
        >
          {phase.kind === "pending" && phase.action === "approve" ? <Spinner className="h-3.5 w-3.5" /> : <CheckIcon className="h-3.5 w-3.5" />}
          {approveLabel[props.kind]}
        </button>
        <button
          type="button"
          onClick={() => void resolve("reject")}
          disabled={busy}
          aria-label={`${rejectLabel[props.kind]}: ${props.subject}`}
          className={buttonClass({ variant: "secondary", size: "sm" })}
        >
          {phase.kind === "pending" && phase.action === "reject" ? <Spinner className="h-3.5 w-3.5" /> : <CloseIcon className="h-3.5 w-3.5" />}
          {rejectLabel[props.kind]}
        </button>
      </div>
      <div aria-live="polite">
        {phase.kind === "error" ? <p className="text-sm text-danger">{phase.message}</p> : null}
      </div>
    </div>
  );
}
