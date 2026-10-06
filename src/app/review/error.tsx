"use client";

import type { ReactElement } from "react";
import { ErrorPanel } from "@/components/ui/ErrorPanel";

export default function ReviewError(props: { error: Error & { digest?: string }; reset: () => void }): ReactElement {
  return <ErrorPanel title="The review queue could not be loaded" digest={props.error.digest} onRetry={props.reset} />;
}
