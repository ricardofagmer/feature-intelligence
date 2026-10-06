import type { ReactElement } from "react";

export function Spinner(props: { className?: string }): ReactElement {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${props.className ?? "h-4 w-4"}`}
    />
  );
}
