import Link from "next/link";
import { Check, Lock, Minus, Timer, X } from "lucide-react";
import { KyfRing } from "@/components/kyf-panel";
import { getCocKit } from "@/lib/coc";
import { jurisdictionCode } from "@/lib/constants";
import { computeKyfReport } from "@/lib/kyf";
import { displayTitle } from "@/lib/shortlist";
import type { Asset } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

type AssetCardProps = {
  asset: Asset & {
    seller?: { name: string; company: string | null } | null;
    matchScore?: number;
    matchReasons?: string[];
  };
  imageIndex?: number;
};

const ENTITY_LABEL: Record<Asset["entityType"], string> = {
  OPERATIONAL: "Operational entity",
  SHELL: "Ready-made entity",
  APPLICATION: "Licence application vehicle",
};

type SignalState = "yes" | "partial" | "no";

function Signal({ state, label }: { state: SignalState; label: string }) {
  const Icon = state === "yes" ? Check : state === "partial" ? Minus : X;
  const tone =
    state === "yes"
      ? "text-[var(--success)]"
      : state === "partial"
        ? "text-[var(--warn)]"
        : "text-[var(--muted)] opacity-60";
  return (
    <li className={`flex items-center gap-1.5 ${state === "no" ? "text-[var(--muted)]" : "text-[var(--text)]"}`}>
      <Icon className={`h-3.5 w-3.5 shrink-0 ${tone}`} strokeWidth={2.5} />
      {label}
    </li>
  );
}

export function AssetCard({ asset }: AssetCardProps) {
  const kyf = computeKyfReport(asset);
  const kit = getCocKit(asset.jurisdiction);
  const banking: SignalState =
    asset.bankingStatus === "ACTIVE" ? "yes" : asset.bankingStatus === "IN_PROGRESS" ? "partial" : "no";

  return (
    <Link href={`/assets/${asset.id}`} className="group surface surface-hover flex h-full flex-col overflow-hidden">
      <div className="deal-sheet-head flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/60">
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono font-bold tracking-normal text-white">
              {jurisdictionCode(asset.jurisdiction)}
            </span>
            <span className="truncate">{asset.regulator || kit.regulator}</span>
          </div>
          <div className="mt-2 truncate font-display text-2xl font-bold text-white">
            {asset.licenseType || asset.category}
          </div>
          <div className="text-xs text-white/55">{ENTITY_LABEL[asset.entityType]}</div>
        </div>
        <KyfRing score={kyf.score} grade={kyf.grade} size={58} dark />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex min-h-6 flex-wrap items-center gap-1.5">
          {asset.discreteMode ? (
            <span className="badge">
              <Lock className="h-3 w-3" /> NDA-gated
            </span>
          ) : null}
          {asset.dealReadiness === "URGENT" ? <span className="badge badge-danger">Urgent exit</span> : null}
          {kyf.grade === "A" ? <span className="badge badge-accent">Deal-ready</span> : null}
          {typeof asset.matchScore === "number" ? (
            <span className="badge badge-warn">{asset.matchScore}% mandate fit</span>
          ) : null}
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug text-[var(--text)]">{displayTitle(asset)}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-[var(--muted)]">
          {asset.discreteMode ? "Seller identity and full teaser unlock after mutual NDA." : asset.summary}
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-medium">
          <Signal state={banking} label={banking === "partial" ? "Banking in progress" : "Active banking"} />
          <Signal state={asset.hasComplianceOfficer ? "yes" : "no"} label="MLRO appointed" />
          <Signal state={asset.hasLocalDirector ? "yes" : "no"} label="Local director" />
          <Signal state={asset.hasPassporting ? "yes" : "no"} label="EEA/UK passporting" />
        </ul>

        <div className="min-h-4 flex-1" />
        <div className="flex items-end justify-between gap-3 border-t border-[var(--border)] pt-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Asking price</div>
            <div className="font-display text-xl font-bold text-[var(--text)]">
              {formatMoney(asset.askingPrice, asset.currency)}
            </div>
          </div>
          <div className="text-right text-xs text-[var(--muted)]">
            <div className="inline-flex items-center gap-1 font-semibold text-[var(--text)]">
              <Timer className="h-3.5 w-3.5 text-[var(--accent-2)]" />
              CoC ~{kit.typicalWeeks} wks
            </div>
            <div>vs 12–24 mo. fresh licence</div>
          </div>
        </div>
        {asset.matchReasons?.length ? (
          <p className="mt-3 text-xs text-[var(--muted)]">{asset.matchReasons.slice(0, 2).join(" · ")}</p>
        ) : null}
      </div>
    </Link>
  );
}

export function BuyerCard({
  buyer,
  href,
  matchScore,
  matchReasons,
}: {
  buyer: {
    id: string;
    name: string;
    company: string | null;
    buyerProfile: {
      headline: string;
      preferredCategories: string;
      preferredJurisdictions: string;
      budgetMin: number;
      budgetMax: number;
      verified: boolean;
      requiresBanking?: boolean;
      requiresPassporting?: boolean;
      identityVerified?: boolean;
      fundsVerified?: boolean;
      verifiedFundsAmount?: number | null;
    } | null;
  };
  href: string;
  matchScore?: number;
  matchReasons?: string[];
}) {
  const profile = buyer.buyerProfile;
  const serious = Boolean(profile?.identityVerified && profile?.fundsVerified);
  return (
    <Link href={href} className="surface surface-hover block p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        {profile?.verified ? <span className="badge badge-accent">Verified</span> : <span className="badge">Unverified</span>}
        {serious ? <span className="badge badge-accent">Serious buyer</span> : null}
        {typeof matchScore === "number" ? <span className="badge badge-warn">{matchScore}% fit</span> : null}
        {profile?.requiresBanking ? <span className="badge">Needs banking</span> : null}
        {profile?.requiresPassporting ? <span className="badge">Needs passporting</span> : null}
      </div>
      <h3 className="font-display text-xl font-semibold">{buyer.name}</h3>
      <p className="text-sm text-[var(--muted)]">{buyer.company}</p>
      <p className="mt-3 line-clamp-2 text-sm">{profile?.headline}</p>
      {profile ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
          <span className="badge">{profile.preferredCategories.split(",")[0]}</span>
          <span className="badge">{profile.preferredJurisdictions.split(",")[0]}</span>
          <span className="badge">
            {formatMoney(profile.budgetMin)} – {formatMoney(profile.budgetMax)}
          </span>
        </div>
      ) : null}
      {matchReasons?.length ? (
        <p className="mt-3 text-xs text-[var(--muted)]">{matchReasons.slice(0, 2).join(" · ")}</p>
      ) : null}
    </Link>
  );
}
