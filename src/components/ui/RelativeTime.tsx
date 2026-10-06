import type { ReactElement } from "react";
import { formatAbsolute, formatRelative } from "@/components/ui/format";

/** Server-rendered only: rendering "x minutes ago" on the client would mismatch hydration. */
export function RelativeTime(props: { value: string }): ReactElement {
  return (
    <time dateTime={props.value} title={formatAbsolute(props.value)}>
      {formatRelative(props.value)}
    </time>
  );
}
