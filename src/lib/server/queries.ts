import type {
  Brief,
  RequestDetailResponse,
  RequestStatus,
  RequestWithMeta,
  ReviewItem,
  ThemeWithStats,
} from "@/lib/types";
import { buildSearchQuery } from "@/lib/server/fts";
import {
  getRequestWithMeta,
  listConsolidatedVoters,
  listResolvedLinks,
  listThemedRequests,
  queryRequests,
  type RequestSort,
} from "@/lib/server/repo";
import {
  getLatestBriefRow,
  getTheme,
  listReviewItems as listReviewItemRows,
  listThemesWithBriefFlag,
} from "@/lib/server/repo-workflow";
import { requestStatusSchema } from "@/lib/server/schemas";

/**
 * Read side. These exports are a frozen contract: server components import
 * them directly, so they tolerate raw query-string values instead of throwing.
 */

/** The response contract carries no pagination metadata, so lists are capped server-side. */
const LIST_HARD_LIMIT = 200;
const TOP_REQUEST_TITLES = 3;

export interface ListRequestsOptions {
  status?: string;
  themeId?: number;
  sort?: RequestSort;
  q?: string;
}

function narrowStatus(value: string | undefined): RequestStatus | undefined {
  if (!value) return undefined;
  const parsed = requestStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

const SORTS: readonly RequestSort[] = ["priority", "support", "new"];

// Server components may forward a raw search param here despite the type.
function narrowSort(value: string | undefined): RequestSort {
  return SORTS.find((sort) => sort === value) ?? "new";
}

function narrowThemeId(value: number | undefined): number | undefined {
  return value !== undefined && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export function listRequests(opts: ListRequestsOptions): RequestWithMeta[] {
  return queryRequests({
    status: narrowStatus(opts.status),
    themeId: narrowThemeId(opts.themeId),
    ftsQuery: opts.q ? (buildSearchQuery(opts.q) ?? undefined) : undefined,
    sort: narrowSort(opts.sort),
    limit: LIST_HARD_LIMIT,
  });
}

export function getRequestDetail(id: number): RequestDetailResponse | null {
  const request = getRequestWithMeta(id);
  if (!request) return null;
  return {
    request,
    theme: request.themeId !== null ? getTheme(request.themeId) : null,
    links: listResolvedLinks(id),
    voters: listConsolidatedVoters(id),
  };
}

export function listThemes(): ThemeWithStats[] {
  const themed = listThemedRequests();
  const themes = listThemesWithBriefFlag().map(({ theme, hasBrief }) => {
    // Rows arrive sorted by support, so the first matches are the top titles.
    const members = themed.filter((row) => row.theme_id === theme.id);
    const scored = members.filter((row) => row.priority_score !== null);
    const scoreSum = scored.reduce((sum, row) => sum + (row.priority_score ?? 0), 0);
    return {
      ...theme,
      requestCount: members.length,
      totalSupport: members.reduce((sum, row) => sum + row.support_count, 0),
      topRequestTitles: members.slice(0, TOP_REQUEST_TITLES).map((row) => row.title),
      avgPriorityScore: scored.length > 0 ? Math.round((scoreSum / scored.length) * 10) / 10 : null,
      hasBrief,
    };
  });
  return themes.sort((a, b) => {
    if (a.status !== b.status) return a.status === "confirmed" ? -1 : 1;
    return b.totalSupport - a.totalSupport;
  });
}

export function listReviewItems(): ReviewItem[] {
  return listReviewItemRows(LIST_HARD_LIMIT);
}

export function getLatestBrief(themeId: number): Brief | null {
  return getLatestBriefRow(themeId);
}
