import type { ReactElement } from "react";
import type { RequestStatus } from "@/lib/types";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

const statusDisplay: Record<RequestStatus, { label: string; tone: BadgeTone; hint: string }> = {
  new: { label: "New", tone: "neutral", hint: "Received, triage not started yet" },
  pending_triage: {
    label: "Pending triage",
    tone: "warning",
    hint: "AI triage was unavailable; queued for a retry",
  },
  triaged: { label: "Triaged", tone: "accent", hint: "Analyzed by the AI triage pipeline" },
  merged: { label: "Merged", tone: "neutral", hint: "Consolidated into another request" },
  planned: { label: "Planned", tone: "accent", hint: "On the roadmap" },
  declined: { label: "Declined", tone: "danger", hint: "Reviewed and declined" },
  shipped: { label: "Shipped", tone: "success", hint: "Available now" },
};

export function statusLabel(status: RequestStatus): string {
  return statusDisplay[status].label;
}

export function StatusBadge(props: { status: RequestStatus }): ReactElement {
  const display = statusDisplay[props.status];
  return (
    <Badge tone={display.tone} title={display.hint}>
      {display.label}
    </Badge>
  );
}
