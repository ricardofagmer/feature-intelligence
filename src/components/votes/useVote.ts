"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveName, useStoredName } from "@/components/identity/storedName";
import { ApiRequestError, describeApiError, voteForRequest } from "@/lib/clientApi";

export type VotePhase =
  | { kind: "idle" }
  | { kind: "askingName" }
  | { kind: "pending" }
  | { kind: "voted"; supportCount: number | null; note: string | null }
  | { kind: "error"; message: string };

export interface VoteController {
  phase: VotePhase;
  storedName: string;
  hasVoted: boolean;
  displayCount: number;
  start: () => void;
  submitName: (name: string) => void;
  cancel: () => void;
}

/**
 * Shared vote flow for the board card and the detail page. `voters` is only known
 * on the detail page; there, "already voted" is derived instead of stored.
 */
export function useVote(options: {
  requestId: number;
  supportCount: number;
  voters?: readonly string[];
}): VoteController {
  const router = useRouter();
  const storedName = useStoredName();
  const [phase, setPhase] = useState<VotePhase>({ kind: "idle" });

  const votedOnServer = Boolean(storedName) && (options.voters?.includes(storedName) ?? false);
  const hasVoted = votedOnServer || phase.kind === "voted";
  const displayCount =
    phase.kind === "voted" && phase.supportCount !== null
      ? Math.max(phase.supportCount, options.supportCount)
      : options.supportCount;

  async function vote(name: string): Promise<void> {
    setPhase({ kind: "pending" });
    try {
      const result = await voteForRequest(options.requestId, name);
      setPhase({ kind: "voted", supportCount: result.supportCount, note: null });
      router.refresh();
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "conflict") {
        setPhase({ kind: "voted", supportCount: null, note: `Already supported as ${name}.` });
        return;
      }
      setPhase({ kind: "error", message: describeApiError(error, "Could not record your vote. Try again.") });
    }
  }

  return {
    phase,
    storedName,
    hasVoted,
    displayCount,
    start: () => {
      if (hasVoted || phase.kind === "pending") return;
      if (!storedName) {
        setPhase({ kind: "askingName" });
        return;
      }
      void vote(storedName);
    },
    submitName: (name: string) => {
      saveName(name);
      void vote(name);
    },
    cancel: () => setPhase({ kind: "idle" }),
  };
}
