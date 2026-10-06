"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { Markdown } from "@/components/markdown/Markdown";
import { Banner } from "@/components/ui/Banner";
import { ChevronDownIcon, SparkIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { formatAbsolute, formatRelative } from "@/components/ui/format";
import { buttonClass, focusRing } from "@/components/ui/styles";
import { ApiRequestError, describeApiError, generateBrief } from "@/lib/clientApi";
import type { Brief } from "@/lib/types";

type BriefPhase = { kind: "idle" } | { kind: "generating" } | { kind: "error"; title: string; message: string };

function errorFor(error: unknown): { title: string; message: string } {
  if (error instanceof ApiRequestError && error.code === "ai_unavailable") {
    return {
      title: "AI brief generation is unavailable",
      message:
        "The AI service is not configured or did not respond, so no brief was written. Theme data is unaffected; try again later.",
    };
  }
  return { title: "Brief generation failed", message: describeApiError(error, "Something went wrong. Try again.") };
}

/**
 * Brief body is only rendered once expanded, which keeps dates (browser time zone)
 * out of the server render and avoids hydration mismatches.
 */
export function BriefSection(props: { themeId: number; themeName: string; initialBrief: Brief | null }): ReactElement {
  const router = useRouter();
  const [generated, setGenerated] = useState<Brief | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<BriefPhase>({ kind: "idle" });

  const brief = generated ?? props.initialBrief;
  const generating = phase.kind === "generating";
  const panelId = `brief-${props.themeId}`;

  async function generate(): Promise<void> {
    setPhase({ kind: "generating" });
    try {
      const response = await generateBrief(props.themeId);
      setGenerated(response.brief);
      setExpanded(true);
      setPhase({ kind: "idle" });
      router.refresh();
    } catch (error) {
      setPhase({ kind: "error", ...errorFor(error) });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {brief ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className={`inline-flex items-center gap-1.5 self-start rounded text-sm font-medium text-accent hover:underline ${focusRing}`}
          >
            {expanded ? "Hide decision brief" : "View latest decision brief"}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <p className="text-sm text-muted">No decision brief yet for this theme.</p>
        )}
        <button
          type="button"
          onClick={() => void generate()}
          disabled={generating}
          className={buttonClass({ variant: brief ? "secondary" : "primary", size: "sm" })}
        >
          {generating ? <Spinner className="h-3.5 w-3.5" /> : <SparkIcon className="h-3.5 w-3.5" />}
          {generating ? "Writing brief…" : brief ? "Regenerate brief" : "Generate decision brief"}
        </button>
      </div>

      <div aria-live="polite">
        {generating ? (
          <p className="text-xs text-muted">
            The AI is synthesizing the requests, support and priority rationale in &ldquo;{props.themeName}&rdquo;
            into a brief. This can take up to a minute.
          </p>
        ) : null}
        {phase.kind === "error" ? (
          <Banner tone="danger" title={phase.title}>
            {phase.message}
          </Banner>
        ) : null}
      </div>

      {brief && expanded ? (
        <article id={panelId} aria-label={`Decision brief for ${props.themeName}`} className="rounded-lg border border-line bg-surface-muted/40 p-4 sm:p-5">
          <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="font-medium text-accent">AI-generated draft</span>
            <span aria-hidden>·</span>
            <time dateTime={brief.createdAt} title={formatAbsolute(brief.createdAt)}>
              {formatRelative(brief.createdAt)}
            </time>
            <span aria-hidden>·</span>
            <span>
              {brief.model}, prompt {brief.promptVersion}
            </span>
          </p>
          <Markdown source={brief.contentMd} />
          <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
            The AI proposes; the product team decides. Verify the evidence against the linked requests before acting.
          </p>
        </article>
      ) : null}
    </div>
  );
}
