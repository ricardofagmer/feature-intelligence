import Link from "next/link";
import type { ReactElement } from "react";
import { Banner } from "@/components/ui/Banner";
import { buttonClass } from "@/components/ui/styles";

export function MergedBanner(props: { canonicalId: number; canonicalTitle: string | null }): ReactElement {
  return (
    <Banner
      tone="info"
      title="This request was merged into another one"
      action={
        <Link href={`/requests/${props.canonicalId}`} className={buttonClass({ size: "sm" })}>
          Go to canonical request
        </Link>
      }
    >
      <p>
        It describes the same need as{" "}
        <span className="font-medium">
          {props.canonicalTitle ? `“${props.canonicalTitle}”` : `request #${props.canonicalId}`}
        </span>
        . Its support now counts there, and updates are tracked on that request.
      </p>
    </Banner>
  );
}
