import type { ReactElement, ReactNode } from "react";

export type BadgeTone = "accent" | "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-neutral-soft text-muted",
};

export function Badge(props: { tone: BadgeTone; children: ReactNode; title?: string }): ReactElement {
  return (
    <span
      title={props.title}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[props.tone]}`}
    >
      {props.children}
    </span>
  );
}
