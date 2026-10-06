import type { ReactElement } from "react";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

function ReviewSkeleton(): ReactElement {
  return (
    <div aria-hidden className="space-y-3 rounded-xl border border-line bg-surface p-5">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-12 w-full" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

export default function ReviewLoading(): ReactElement {
  return (
    <LoadingRegion label="Loading review queue">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="space-y-3">
          <ReviewSkeleton />
          <ReviewSkeleton />
        </div>
      </div>
    </LoadingRegion>
  );
}
