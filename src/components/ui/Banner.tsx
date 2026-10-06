import type { ReactElement, ReactNode } from "react";

export type BannerTone = "success" | "warning" | "danger" | "info";

const toneClasses: Record<BannerTone, string> = {
  success: "border-success/30 bg-success-soft",
  warning: "border-warning/30 bg-warning-soft",
  danger: "border-danger/30 bg-danger-soft",
  info: "border-accent/25 bg-accent-soft",
};

const titleClasses: Record<BannerTone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-accent",
};

/** Status message block. Danger/warning announce assertively; success/info politely. */
export function Banner(props: {
  tone: BannerTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}): ReactElement {
  const assertive = props.tone === "danger" || props.tone === "warning";
  return (
    <div
      role={assertive ? "alert" : "status"}
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-start sm:justify-between ${toneClasses[props.tone]}`}
    >
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${titleClasses[props.tone]}`}>{props.title}</p>
        {props.children ? <div className="mt-1 text-sm text-fg">{props.children}</div> : null}
      </div>
      {props.action ? <div className="flex shrink-0 items-center gap-2">{props.action}</div> : null}
    </div>
  );
}
