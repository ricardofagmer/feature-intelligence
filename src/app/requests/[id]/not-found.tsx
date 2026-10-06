import Link from "next/link";
import type { ReactElement } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/styles";

export default function RequestNotFound(): ReactElement {
  return (
    <EmptyState
      title="Request not found"
      description="This feature request does not exist. It may have been removed, or the link is mistyped."
      action={
        <Link href="/" className={buttonClass({ variant: "secondary" })}>
          Back to the board
        </Link>
      }
    />
  );
}
