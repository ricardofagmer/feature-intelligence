import type { ReactElement } from "react";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

function ThemeSkeleton(): ReactElement {
  return (
    <div aria-hidden className="space-y-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

export default function ThemesLoading(): ReactElement {
  return (
    <LoadingRegion label="Loading themes">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ThemeSkeleton />
          <ThemeSkeleton />
          <ThemeSkeleton />
          <ThemeSkeleton />
        </div>
      </div>
    </LoadingRegion>
  );
}
