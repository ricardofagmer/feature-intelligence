"use client";

import type { ReactElement } from "react";
import { buttonClass } from "@/components/ui/styles";

/**
 * Body of every route error boundary. The raw error message is not shown: server
 * errors can carry internals, so the user gets a stable message and the digest
 * for support.
 */
export function ErrorPanel(props: { title: string; digest?: string; onRetry: () => void }): ReactElement {
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-danger">{props.title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-fg">
        Something went wrong while loading this page. Your data is safe — try again, and if it keeps
        happening, share the reference below with the team.
      </p>
      {props.digest ? <p className="mt-2 font-mono text-xs text-muted">Reference: {props.digest}</p> : null}
      <button type="button" onClick={props.onRetry} className={`mt-5 ${buttonClass({ variant: "secondary" })}`}>
        Try again
      </button>
    </div>
  );
}
