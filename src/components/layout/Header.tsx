import Link from "next/link";
import type { ReactElement } from "react";
import { NavLinks } from "@/components/layout/NavLinks";
import { LogoMark } from "@/components/ui/Icons";
import { focusRing } from "@/components/ui/styles";

export function Header(props: { openReviewCount: number | null }): ReactElement {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className={`flex shrink-0 items-center gap-2 rounded-lg ${focusRing}`}>
          <LogoMark />
          <span className="hidden text-sm font-semibold tracking-tight text-fg sm:inline">Feature Intelligence</span>
          <span className="sr-only sm:hidden">Feature Intelligence</span>
        </Link>
        <nav aria-label="Primary" className="-mr-2 overflow-x-auto">
          <NavLinks openReviewCount={props.openReviewCount} />
        </nav>
      </div>
    </header>
  );
}
