"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type FormEvent, type ReactElement } from "react";
import {
  MAX_QUERY_LENGTH,
  SORT_OPTIONS,
  STATUS_FILTERS,
  boardHref,
  hasActiveFilters,
  type BoardQuery,
} from "@/components/board/boardQuery";
import { SearchIcon } from "@/components/ui/Icons";
import { SelectField } from "@/components/ui/SelectField";
import { Spinner } from "@/components/ui/Spinner";
import { buttonClass, inputClass, linkClass } from "@/components/ui/styles";

interface ThemeOption {
  id: number;
  name: string;
}

/**
 * The server page owns the query; the toolbar only writes the URL. The search
 * input is uncontrolled and re-keyed on q so it resets when the URL changes from
 * elsewhere (e.g. "Clear filters").
 */
export function BoardToolbar(props: { query: BoardQuery; themes: ThemeOption[] }): ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(next: BoardQuery): void {
    startTransition(() => {
      router.push(boardHref(next), { scroll: false });
    });
  }

  function onSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    const q = typeof value === "string" ? value.trim().slice(0, MAX_QUERY_LENGTH) : "";
    navigate({ ...props.query, q });
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <form role="search" onSubmit={onSearch} className="min-w-0 flex-1">
          <label htmlFor="board-search" className="mb-1 block text-xs font-medium text-muted">
            Search requests
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                key={props.query.q}
                id="board-search"
                name="q"
                type="search"
                defaultValue={props.query.q}
                maxLength={MAX_QUERY_LENGTH}
                placeholder="Titles, descriptions, underlying needs"
                className={`${inputClass} pl-9`}
              />
            </div>
            <button type="submit" className={buttonClass({ variant: "secondary" })}>
              Search
            </button>
          </div>
        </form>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[32rem]">
          <SelectField
            id="board-status"
            label="Status"
            value={props.query.status ?? ""}
            onChange={(value) =>
              navigate({ ...props.query, status: STATUS_FILTERS.find((option) => option.value === value)?.value ?? null })
            }
          >
            <option value="">All statuses</option>
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="board-theme"
            label="Theme"
            value={props.query.themeId === null ? "" : String(props.query.themeId)}
            onChange={(value) =>
              navigate({ ...props.query, themeId: props.themes.find((theme) => String(theme.id) === value)?.id ?? null })
            }
          >
            <option value="">All themes</option>
            {props.themes.map((theme) => (
              <option key={theme.id} value={String(theme.id)}>
                {theme.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="board-sort"
            label="Sort by"
            value={props.query.sort}
            onChange={(value) =>
              navigate({ ...props.query, sort: SORT_OPTIONS.find((option) => option.value === value)?.value ?? "priority" })
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>
      </div>
      <div className="mt-2 flex min-h-5 items-center justify-between gap-3 px-1 text-xs text-muted">
        <span className="inline-flex items-center gap-2" aria-live="polite">
          {isPending ? (
            <>
              <Spinner className="h-3 w-3" />
              Updating results
            </>
          ) : null}
        </span>
        {hasActiveFilters(props.query) ? (
          <Link href={boardHref({ status: null, themeId: null, q: "", sort: props.query.sort })} className={linkClass}>
            Clear filters
          </Link>
        ) : null}
      </div>
    </div>
  );
}
