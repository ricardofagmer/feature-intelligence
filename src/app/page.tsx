import Link from "next/link";
import type { ReactElement } from "react";
import { BoardToolbar } from "@/components/board/BoardToolbar";
import { RequestCard } from "@/components/board/RequestCard";
import { SubmitRequestPanel } from "@/components/board/SubmitRequestPanel";
import { SORT_OPTIONS, hasActiveFilters, parseBoardQuery } from "@/components/board/boardQuery";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { pluralize } from "@/components/ui/format";
import { buttonClass } from "@/components/ui/styles";
import { listRequests, listThemes } from "@/lib/server/services";

export const dynamic = "force-dynamic";

export default async function BoardPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const query = parseBoardQuery(await props.searchParams);
  const requests = listRequests({
    status: query.status ?? undefined,
    themeId: query.themeId ?? undefined,
    sort: query.sort,
    q: query.q || undefined,
  });
  const themes = listThemes().map((theme) => ({ id: theme.id, name: theme.name }));
  const filtered = hasActiveFilters(query);
  const sortLabel = SORT_OPTIONS.find((option) => option.value === query.sort)?.label ?? "Top priority";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Request board"
        description="Every request is triaged by AI on arrival: the underlying need, duplicates, theme and a priority score you can inspect. Humans make the final calls."
      />

      <SubmitRequestPanel />

      <BoardToolbar query={query} themes={themes} />

      <section aria-labelledby="results-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <h2 id="results-heading" className="text-sm font-medium text-fg">
            {pluralize(requests.length, "request")}
            {filtered ? " matching your filters" : ""}
          </h2>
          <p className="text-xs text-muted">Sorted by {sortLabel.toLowerCase()}</p>
        </div>

        {requests.length === 0 ? (
          filtered ? (
            <EmptyState
              title="No requests match these filters"
              description="Try a broader search or a different status. The AI searches titles, descriptions and the underlying needs it extracted."
              action={
                <Link href="/" className={buttonClass({ variant: "secondary" })}>
                  Clear filters
                </Link>
              }
            />
          ) : (
            <EmptyState
              title="No feature requests yet"
              description="Submit the first one above. It will be triaged automatically and show up here with its underlying need and a priority score."
            />
          )
        ) : (
          <ul className="space-y-3">
            {requests.map((request) => (
              <li key={request.id}>
                <RequestCard request={request} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
