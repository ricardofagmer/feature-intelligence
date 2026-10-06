import type { ReactElement, ReactNode } from "react";

export function EmptyState(props: { title: string; description: string; action?: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <div aria-hidden className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
      </div>
      <h2 className="text-base font-semibold text-fg">{props.title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted">{props.description}</p>
      {props.action ? <div className="mt-5">{props.action}</div> : null}
    </div>
  );
}
