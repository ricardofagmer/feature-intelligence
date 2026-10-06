import type { ReactElement } from "react";
import { LoadingRegion, Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function BoardLoading(): ReactElement {
  return (
    <LoadingRegion label="Loading the request board">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </LoadingRegion>
  );
}
