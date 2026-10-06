"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { buttonClass } from "@/components/ui/styles";
import { describeApiError, retriageRequest } from "@/lib/clientApi";

type RetriagePhase = { kind: "idle" } | { kind: "running" } | { kind: "error"; message: string };

export function RetriageButton(props: { requestId: number }): ReactElement {
  const router = useRouter();
  const [phase, setPhase] = useState<RetriagePhase>({ kind: "idle" });
  const running = phase.kind === "running";

  async function run(): Promise<void> {
    setPhase({ kind: "running" });
    try {
      const result = await retriageRequest(props.requestId);
      if (result.request.status === "pending_triage") {
        setPhase({
          kind: "error",
          message: "AI triage is still unavailable. The request stays queued; try again later.",
        });
        return;
      }
      setPhase({ kind: "idle" });
      router.refresh();
    } catch (error) {
      setPhase({ kind: "error", message: describeApiError(error, "Re-running triage failed. Try again.") });
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => void run()} disabled={running} className={buttonClass()}>
        {running ? <Spinner /> : null}
        {running ? "AI is triaging…" : "Re-run AI triage"}
      </button>
      <div aria-live="polite">
        {phase.kind === "error" ? <p className="text-sm text-danger">{phase.message}</p> : null}
      </div>
    </div>
  );
}
