import type { ReactElement } from "react";
import { Badge } from "@/components/ui/Badge";
import type { ReviewKind } from "@/lib/types";

export function ReviewKindBadge(props: { kind: ReviewKind }): ReactElement {
  return props.kind === "merge" ? (
    <Badge tone="warning">Possible duplicate</Badge>
  ) : (
    <Badge tone="accent">New theme proposal</Badge>
  );
}
