"use client";

import type { ReactElement } from "react";
import { ErrorPanel } from "@/components/ui/ErrorPanel";

export default function ThemesError(props: { error: Error & { digest?: string }; reset: () => void }): ReactElement {
  return <ErrorPanel title="Themes could not be loaded" digest={props.error.digest} onRetry={props.reset} />;
}
