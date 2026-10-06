import Link from "next/link";
import { AssetCard } from "@/components/cards";
import { PageShell } from "@/components/ui";
import { scoreAssetForBuyer } from "@/lib/ai";
import { buyerTrustLabel, isSeriousBuyer } from "@/lib/deals";
import { computeKyfReport } from "@/lib/kyf";
import { guardSession } from "@/lib/guards";
import { store } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

export default async function BuyerDashboardPage() {
  const session = await guardSession(["BUYER"]);
  const buyer = store.getUserById(session.id);
  const assets = store.listAssets({ status: "PUBLISHED" });
  const matched = assets
    .map((asset) => {
      const score = scoreAssetForBuyer(asset, buyer!);
      return {
        ...asset,
        matchScore: score.score,
        matchReasons: score.reasons,
        gaps: score.gaps || [],
        fitLabel: score.fitLabel,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const digest = matched.slice(0, 6);
  const unread = store.countUnread(session.id);
  const profile = buyer?.buyerProfile;
  const rooms = store.listDealRoomsForBuyer(session.id);
  const topKyf = digest[0] ? computeKyfReport(digest[0]) : null;
  const serious = isSeriousBuyer(profile);

  return (
    <PageShell
      title={`Welcome, ${session.name.split(" ")[0]}`}
      subtitle="Weekly-style mandate digest: ranked fits, KYF grades, and Deal Room progress — not a dump of the full catalogue."
      actions={
        <>
          <Link href="/profile" className="btn btn-secondary">
            Trust & mandate
          </Link>
          <Link href="/assets" className="btn btn-primary">
            Browse all assets
          </Link>
        </>
      }
    >
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Trust Gate</div>
          <div className="mt-2 font-display text-xl font-bold">{buyerTrustLabel(profile)}</div>
          {!serious ? (
            <Link href="/profile" className="mt-2 inline-block text-sm text-[var(--accent)]">
              Complete verification →
            </Link>
          ) : (
            <p className="mt-2 text-xs text-[var(--muted)]">
              {formatMoney(profile?.verifiedFundsAmount || 0)} verified
            </p>
          )}
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Mandate filters</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {profile?.requiresBanking ? (
              <span className="badge badge-accent">Banking</span>
            ) : (
              <span className="badge">Banking optional</span>
            )}
            {profile?.requiresPassporting ? (
              <span className="badge badge-accent">Passporting</span>
            ) : (
              <span className="badge">Passporting optional</span>
            )}
          </div>
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Top KYF fit</div>
          <div className="mt-2 font-display text-2xl font-bold">
            {topKyf ? `${topKyf.grade} · ${topKyf.score}` : "—"}
          </div>
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Active Deal Rooms</div>
          <div className="mt-2 font-display text-2xl font-bold">{rooms.length}</div>
          <Link href="/messages" className="mt-2 inline-block text-sm text-[var(--accent)]">
            Inbox ({unread}) →
          </Link>
        </div>
      </div>

      {profile ? (
        <div className="surface mb-8 p-5">
          <h2 className="font-display text-xl font-semibold">{profile.headline}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{profile.interests}</p>
          {profile.servicesNeeded ? (
            <p className="mt-2 text-xs text-[var(--muted)]">Services: {profile.servicesNeeded}</p>
          ) : null}
        </div>
      ) : (
        <div className="surface mb-8 p-5">
          <p className="text-sm">
            Complete your buyer profile to unlock ranked matching.{" "}
            <Link href="/profile" className="text-[var(--accent)]">
              Set up profile
            </Link>
          </p>
        </div>
      )}

      {rooms.length ? (
        <div className="mb-10">
          <h2 className="mb-3 font-display text-2xl font-bold">Your Deal Rooms</h2>
          <div className="space-y-2">
            {rooms.map((room) => {
              const asset = store.getAsset(room.assetId);
              if (!asset) return null;
              return (
                <Link
                  key={room.id}
                  href={`/assets/${asset.id}`}
                  className="surface surface-hover flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold">{asset.title}</div>
                    <div className="text-sm text-[var(--muted)]">
                      {asset.jurisdiction} · stage {room.stage}
                    </div>
                  </div>
                  <span className="badge badge-accent">{room.checklistDone.length} CoC items</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mb-4">
        <h2 className="font-display text-2xl font-bold">Mandate digest</h2>
        <p className="text-sm text-[var(--muted)]">
          Top fits with gap callouts — complete Trust Gate to unlock discrete listings faster.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {digest.map((asset) => (
          <div key={asset.id} className="flex h-full flex-col gap-2">
            <AssetCard asset={asset} />
            {asset.gaps.length ? (
              <p className="px-1 text-xs text-[var(--muted)]">Gaps: {asset.gaps.slice(0, 2).join(" · ")}</p>
            ) : null}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
