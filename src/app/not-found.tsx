import Link from "next/link";
import type { ReactElement } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/styles";

export default function NotFound(): ReactElement {
  return (
    <EmptyState
      title="Page not found"
      description="The page you were looking for does not exist or has moved."
      action={
        <Link href="/" className={buttonClass({ variant: "secondary" })}>
          Back to the board
        </Link>
      }
    />
  );
}
