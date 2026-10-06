import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";
import { ThemeCard } from "@/components/themes/ThemeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { pluralize } from "@/components/ui/format";
import { buttonClass } from "@/components/ui/styles";
import { getLatestBrief, listThemes } from "@/lib/server/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Themes" };

export default function ThemesPage(): ReactElement {
  // Briefs are only read for themes that have one; SQLite reads are local and synchronous.
  const themes = listThemes().map((theme) => ({
    theme,
    latestBrief: theme.hasBrief ? getLatestBrief(theme.id) : null,
  }));
  const proposedCount = themes.filter((entry) => entry.theme.status === "proposed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Themes"
        description={
          <>
            Themes emerge from the requests themselves: the AI groups each request by its underlying need, and new themes
            stay proposed until a PM confirms them. Generate a decision brief to turn a theme into a recommendation.
          </>
        }
        actions={
          proposedCount > 0 ? (
            <Link href="/review" className={buttonClass({ variant: "secondary", size: "sm" })}>
              Review {pluralize(proposedCount, "proposed theme")}
            </Link>
          ) : null
        }
      />

      {themes.length === 0 ? (
        <EmptyState
          title="No themes yet"
          description="Themes appear as the AI triages requests and finds shared underlying needs. Submit a few requests to see them form."
          action={
            <Link href="/" className={buttonClass({ variant: "secondary" })}>
              Go to the board
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          {themes.map((entry) => (
            <li key={entry.theme.id} className="min-w-0">
              <ThemeCard theme={entry.theme} latestBrief={entry.latestBrief} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
