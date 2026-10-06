import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ReviewHistory } from "@/components/review/ReviewHistory";
import { ReviewItemCard } from "@/components/review/ReviewItemCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { pluralize } from "@/components/ui/format";
import { listReviewItems } from "@/lib/server/services";
import { AUTO_MERGE_CONFIDENCE, REVIEW_MIN_CONFIDENCE } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Review Queue" };

export default function ReviewPage(): ReactElement {
  const items = listReviewItems();
  const open = items.filter((item) => item.status === "open");
  const resolved = items.filter((item) => item.status !== "open");
  const autoPercent = Math.round(AUTO_MERGE_CONFIDENCE * 100);
  const minPercent = Math.round(REVIEW_MIN_CONFIDENCE * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review queue"
        description={
          <>
            AI proposes, humans decide. Duplicates the AI is at least {autoPercent}% sure about are merged
            automatically; anything between {minPercent}% and {autoPercent}%, and every new theme, waits here for a
            product manager.
          </>
        }
      />

      <section aria-labelledby="open-heading" className="space-y-3">
        <h2 id="open-heading" className="px-1 text-sm font-medium text-fg">
          {open.length === 0 ? "Open items" : `${pluralize(open.length, "item")} waiting for a decision`}
        </h2>
        {open.length === 0 ? (
          <EmptyState
            title="Nothing waiting for review — the AI is confident about everything so far."
            description="Borderline duplicates and new theme proposals will appear here when they need a human decision."
          />
        ) : (
          <ul className="space-y-3">
            {open.map((item) => (
              <li key={item.id}>
                <ReviewItemCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {resolved.length > 0 ? <ReviewHistory items={resolved} /> : null}
    </div>
  );
}
