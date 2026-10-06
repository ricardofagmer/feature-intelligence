import type { ReactElement } from "react";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function RequestDetailLoading(): ReactElement {
  return (
    <LoadingRegion label="Loading request">
      <div className="space-y-6">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
