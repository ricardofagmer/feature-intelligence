import type { ReactElement, ReactNode } from "react";

export function PageHeader(props: { title: string; description: ReactNode; actions?: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{props.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{props.description}</p>
      </div>
      {props.actions ? <div className="flex shrink-0 items-center gap-2">{props.actions}</div> : null}
    </div>
  );
}
