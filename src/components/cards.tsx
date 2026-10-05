import Link from "next/link";
import type { Asset } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

type AssetCardProps = {
  asset: Asset & {
    seller?: { name: string; company: string | null } | null;
    matchScore?: number;
    matchReasons?: string[];
  };
};

export function AssetCard({ asset }: AssetCardProps) {
  return (
    <Link href={`/assets/${asset.id}`} className="surface surface-hover block p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="badge badge-accent">{asset.category}</span>
        <span className="badge">{asset.jurisdiction}</span>
        {asset.licenseType ? <span className="badge">{asset.licenseType}</span> : null}
        {typeof asset.matchScore === "number" ? (
          <span className="badge badge-warn">{asset.matchScore}% match</span>
        ) : null}
      </div>
      <h3 className="font-display text-xl font-semibold leading-snug">{asset.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{asset.summary}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Asking</div>
          <div className="text-lg font-semibold text-[var(--accent)]">
            {formatMoney(asset.askingPrice, asset.currency)}
          </div>
        </div>
        {asset.seller ? (
          <div className="text-right text-xs text-[var(--muted)]">
            <div>Seller</div>
            <div className="font-medium text-white">{asset.seller.company || asset.seller.name}</div>
          </div>
        ) : null}
      </div>
      {asset.matchReasons?.length ? (
        <p className="mt-3 text-xs text-[var(--muted)]">{asset.matchReasons.slice(0, 2).join(" · ")}</p>
      ) : null}
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
    } | null;
  };
  href: string;
  matchScore?: number;
  matchReasons?: string[];
}) {
  const profile = buyer.buyerProfile;
  return (
    <Link href={href} className="surface surface-hover block p-5">
      <div className="mb-3 flex flex-wrap gap-2">
        {profile?.verified ? <span className="badge badge-accent">Verified</span> : <span className="badge">Unverified</span>}
        {typeof matchScore === "number" ? <span className="badge badge-warn">{matchScore}% fit</span> : null}
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
