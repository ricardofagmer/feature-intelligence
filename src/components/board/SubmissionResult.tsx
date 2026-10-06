"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { Banner } from "@/components/ui/Banner";
import { buttonClass } from "@/components/ui/styles";
import type { CreateRequestResponse } from "@/lib/types";

/** Immediate feedback on what the AI decided, so the requester sees triage happen. */
export function SubmissionResult(props: { response: CreateRequestResponse; onDismiss: () => void }): ReactElement {
  const { request, triageSummary } = props.response;
  const actions = (
    <>
      <Link href={`/requests/${request.id}`} className={buttonClass({ variant: "secondary", size: "sm" })}>
        View request
      </Link>
      <button type="button" onClick={props.onDismiss} className={buttonClass({ variant: "ghost", size: "sm" })}>
        Dismiss
      </button>
    </>
  );

  if (request.status === "pending_triage") {
    return (
      <Banner tone="warning" title="AI triage unavailable — your request is queued" action={actions}>
        <p>
          &ldquo;{request.title}&rdquo; was saved. The AI could not analyze it right now, so it is marked
          &ldquo;Pending triage&rdquo; and can be re-run from the request page. Nothing was lost.
        </p>
      </Banner>
    );
  }

  const title =
    request.status === "merged" ? "Triaged — matched an existing request" : "Triaged by AI";
  return (
    <Banner tone="success" title={title} action={actions}>
      {triageSummary ? (
        <p>{triageSummary}</p>
      ) : (
        <p>&ldquo;{request.title}&rdquo; was submitted and analyzed.</p>
      )}
      {request.problemStatement ? (
        <p className="mt-1 text-muted">
          <span className="font-medium text-fg">Underlying need:</span> {request.problemStatement}
        </p>
      ) : null}
    </Banner>
  );
}
