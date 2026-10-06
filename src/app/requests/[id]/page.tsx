import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { AsSubmitted } from "@/components/detail/AsSubmitted";
import { LinksSection } from "@/components/detail/LinksSection";
import { MergedBanner } from "@/components/detail/MergedBanner";
import { SupportPanel } from "@/components/detail/SupportPanel";
import { TriagePanel } from "@/components/detail/TriagePanel";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { linkClass } from "@/components/ui/styles";
import { getRequestDetail } from "@/lib/server/services";

export const dynamic = "force-dynamic";

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

function parseRequestId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number.parseInt(raw, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata(props: DetailPageProps): Promise<Metadata> {
  const id = parseRequestId((await props.params).id);
  const detail = id === null ? null : getRequestDetail(id);
  return { title: detail ? detail.request.title : "Request not found" };
}

export default async function RequestDetailPage(props: DetailPageProps): Promise<ReactElement> {
  const id = parseRequestId((await props.params).id);
  if (id === null) notFound();
  const detail = getRequestDetail(id);
  if (!detail) notFound();

  const { request, theme, links, voters } = detail;
  const canonicalTitle =
    request.canonicalRequestId === null
      ? null
      : (links.find((link) => link.otherId === request.canonicalRequestId)?.otherTitle ?? null);

  return (
    <div className="space-y-6">
      <Link href="/" className={`inline-flex items-center gap-1.5 text-sm ${linkClass}`}>
        <ArrowLeftIcon />
        Back to board
      </Link>

      {request.status === "merged" && request.canonicalRequestId !== null ? (
        <MergedBanner canonicalId={request.canonicalRequestId} canonicalTitle={canonicalTitle} />
      ) : null}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={request.status} />
          <PriorityBadge score={request.priorityScore} rationale={request.priorityRationale} />
          <span className="text-xs text-muted">Request #{request.id}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{request.title}</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <TriagePanel request={request} theme={theme} />
          <AsSubmitted request={request} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <SupportPanel
            requestId={request.id}
            supportCount={request.supportCount}
            duplicateCount={request.duplicateCount}
            voters={voters}
          />
          <LinksSection request={request} links={links} />
        </div>
      </div>
    </div>
  );
}
