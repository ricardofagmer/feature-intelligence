import type { ReactElement, ReactNode } from "react";

export function Skeleton(props: { className?: string }): ReactElement {
  return <div aria-hidden className={`animate-pulse rounded-md bg-surface-muted ${props.className ?? ""}`} />;
}

/** Card-shaped placeholder matching the request/theme/review card rhythm. */
export function SkeletonCard(): ReactElement {
  return (
    <div aria-hidden className="rounded-xl border border-line bg-surface p-5">
      <div className="flex gap-4">
        <Skeleton className="h-14 w-12 shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingRegion(props: { label: string; children: ReactNode }): ReactElement {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{props.label}</span>
      {props.children}
    </div>
  );
}
