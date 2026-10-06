import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { listReviewItems } from "@/lib/server/services";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Feature Intelligence", template: "%s | Feature Intelligence" },
  description: "AI-first feature request triage: underlying needs, duplicates, themes and priority, reviewed by humans.",
};

/**
 * The nav badge is a convenience. If the queue cannot be read here, the header
 * still renders and the /review page surfaces the real error through its boundary.
 */
function countOpenReviewItems(): number | null {
  try {
    return listReviewItems().filter((item) => item.status === "open").length;
  } catch {
    return null;
  }
}

export default function RootLayout(props: { children: ReactNode }): ReactElement {
  const openReviewCount = countOpenReviewItems();
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-fg focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <Header openReviewCount={openReviewCount} />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
          {props.children}
        </main>
      </body>
    </html>
  );
}
