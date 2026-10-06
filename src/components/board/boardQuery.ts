import type { RequestStatus } from "@/lib/types";

/** URL state of the board. Parsed by allowlist: anything unknown falls back to the default. */
export type BoardSort = "priority" | "support" | "new";

export interface BoardQuery {
  status: RequestStatus | null;
  themeId: number | null;
  sort: BoardSort;
  q: string;
}

export const MAX_QUERY_LENGTH = 200;

export const STATUS_FILTERS: ReadonlyArray<{ value: RequestStatus; label: string }> = [
  { value: "triaged", label: "Triaged" },
  { value: "pending_triage", label: "Pending triage" },
  { value: "planned", label: "Planned" },
  { value: "declined", label: "Declined" },
  { value: "shipped", label: "Shipped" },
  { value: "merged", label: "Merged" },
];

export const SORT_OPTIONS: ReadonlyArray<{ value: BoardSort; label: string }> = [
  { value: "priority", label: "Top priority" },
  { value: "support", label: "Most supported" },
  { value: "new", label: "Newest" },
];

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseBoardQuery(params: RawParams): BoardQuery {
  const statusRaw = first(params.status);
  const sortRaw = first(params.sort);
  const themeRaw = first(params.theme);
  const themeId = /^\d+$/.test(themeRaw) ? Number.parseInt(themeRaw, 10) : null;
  return {
    status: STATUS_FILTERS.find((option) => option.value === statusRaw)?.value ?? null,
    themeId: themeId !== null && themeId > 0 ? themeId : null,
    sort: SORT_OPTIONS.find((option) => option.value === sortRaw)?.value ?? "priority",
    q: first(params.q).trim().slice(0, MAX_QUERY_LENGTH),
  };
}

/** Serializes only non-default values so URLs stay short and shareable. */
export function boardHref(query: BoardQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.themeId !== null) params.set("theme", String(query.themeId));
  if (query.sort !== "priority") params.set("sort", query.sort);
  const search = params.toString();
  return search ? `/?${search}` : "/";
}

export function hasActiveFilters(query: BoardQuery): boolean {
  return Boolean(query.q) || query.status !== null || query.themeId !== null;
}
