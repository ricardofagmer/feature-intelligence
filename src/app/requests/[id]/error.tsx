"use client";

import type { ReactElement } from "react";
import { ErrorPanel } from "@/components/ui/ErrorPanel";

export default function RequestDetailError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactElement {
  return <ErrorPanel title="This request could not be loaded" digest={props.error.digest} onRetry={props.reset} />;
}
