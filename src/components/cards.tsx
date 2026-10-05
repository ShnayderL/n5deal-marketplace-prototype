import Image from "next/image";
import Link from "next/link";
import type { Asset } from "@/lib/types";
import { listingImage } from "@/lib/images";
import { formatMoney } from "@/lib/utils";

type AssetCardProps = {
  asset: Asset & {
    seller?: { name: string; company: string | null } | null;
    matchScore?: number;
    matchReasons?: string[];
  };
  imageIndex?: number;
};

export function AssetCard({ asset, imageIndex = 0 }: AssetCardProps) {
  const img = listingImage(imageIndex);

  return (
    <Link href={`/assets/${asset.id}`} className="group surface surface-hover flex h-full flex-col overflow-hidden">
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-[var(--bg-soft)]">
        <Image
          src={img}
          alt=""
          fill
          className="img-zoom object-cover"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 group-hover:from-black/60" />
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          <span className="badge badge-accent !border-white/30 !bg-white/90">{asset.category}</span>
          <span className="badge !border-white/30 !bg-white/90 !text-[var(--text)]">{asset.jurisdiction}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex min-h-7 flex-wrap items-center gap-2">
          {asset.licenseType ? <span className="badge">{asset.licenseType}</span> : (
            <span className="invisible badge">—</span>
          )}
          {typeof asset.matchScore === "number" ? (
            <span className="badge badge-warn">{asset.matchScore}% match</span>
          ) : null}
        </div>
        <h3 className="font-display text-xl font-semibold leading-snug text-[var(--text)]">{asset.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-[var(--muted)]">{asset.summary}</p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Asking</div>
            <div className="text-lg font-semibold text-[var(--accent-2)]">
              {formatMoney(asset.askingPrice, asset.currency)}
            </div>
          </div>
          {asset.seller ? (
            <div className="text-right text-xs text-[var(--muted)]">
              <div>Seller</div>
              <div className="font-medium text-[var(--text)]">{asset.seller.company || asset.seller.name}</div>
            </div>
          ) : null}
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
