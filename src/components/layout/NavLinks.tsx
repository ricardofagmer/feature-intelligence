"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { focusRing } from "@/components/ui/styles";

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "Board" },
  { href: "/themes", label: "Themes" },
  { href: "/review", label: "Review Queue" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/requests");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks(props: { openReviewCount: number | null }): ReactElement {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const showCount = item.href === "/review" && props.openReviewCount !== null && props.openReviewCount > 0;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${focusRing} ${
                active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-muted hover:text-fg"
              }`}
            >
              {item.label}
              {showCount ? (
                <span className="rounded-full bg-accent-solid px-1.5 py-px text-[11px] font-semibold tabular-nums text-on-accent">
                  <span className="sr-only">, </span>
                  {props.openReviewCount}
                  <span className="sr-only"> open</span>
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
