import Link from "next/link";
import { BuyerCard } from "@/components/cards";
import { PageShell } from "@/components/ui";
import { scoreBuyerForAsset } from "@/lib/ai";
import { computeKyfReport } from "@/lib/kyf";
import { buildInterestHeatmap, buyerTrustLabel, isSeriousBuyer } from "@/lib/deals";
import { guardSession } from "@/lib/guards";
import { store } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

export default async function SellerDashboardPage() {
  const session = await guardSession(["SELLER"]);
  const assets = store.listAssets({ sellerId: session.id });
  const buyers = store.listUsers({ role: "BUYER", status: "ACTIVE" });
  const unread = store.countUnread(session.id);
  const rooms = store.listDealRoomsForSeller(session.id);
  const primaryAsset = assets.find((a) => a.status === "PUBLISHED") || assets[0];

  const seriousBuyers = buyers.filter((b) => isSeriousBuyer(b.buyerProfile));

  const rankedBuyers = primaryAsset
    ? seriousBuyers
        .map((buyer) => {
          const match = scoreBuyerForAsset(buyer, primaryAsset);
          return { ...buyer, matchScore: match.score, matchReasons: match.reasons };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4)
    : seriousBuyers.slice(0, 4).map((b) => ({
        ...b,
        matchScore: undefined as number | undefined,
        matchReasons: undefined as string[] | undefined,
      }));

  const heatBuyers = primaryAsset
    ? rooms
        .filter((r) => r.assetId === primaryAsset.id)
        .map((room) => {
          const user = store.getUserById(room.buyerId);
          return user?.buyerProfile ? { profile: user.buyerProfile, room } : null;
        })
        .filter(Boolean) as { profile: NonNullable<(typeof buyers)[0]["buyerProfile"]>; room: (typeof rooms)[0] }[]
    : [];

  const heatmap = primaryAsset ? buildInterestHeatmap(primaryAsset, heatBuyers) : [];

  return (
    <PageShell
      title="Seller workspace"
      subtitle="Quality inbound only: serious (ID + funds) buyers, Deal Room stages, and gap heatmaps from mandate mismatches."
      actions={
        <>
          <Link href="/buyers" className="btn btn-secondary">
            Browse buyers
          </Link>
          <Link href="/assets/new" className="btn btn-primary">
            Publish asset
          </Link>
        </>
      }
    >
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Your listings</div>
          <div className="mt-2 font-display text-2xl font-bold">{assets.length}</div>
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Published ask value</div>
          <div className="mt-2 font-display text-2xl font-bold">
            {formatMoney(assets.filter((a) => a.status === "PUBLISHED").reduce((s, a) => s + a.askingPrice, 0))}
          </div>
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Deal Rooms</div>
          <div className="mt-2 font-display text-2xl font-bold">{rooms.length}</div>
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Unread messages</div>
          <div className="mt-2 font-display text-2xl font-bold">{unread}</div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="mb-4 font-display text-2xl font-bold">Your assets</h2>
        <div className="space-y-3">
          {assets.map((asset) => {
            const kyf = computeKyfReport(asset);
            const inbound = rooms.filter((r) => r.assetId === asset.id).length;
            return (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="surface surface-hover flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold">{asset.title}</div>
                  <div className="text-sm text-[var(--muted)]">
                    {asset.category} · {asset.jurisdiction} · {asset.status}
                    {asset.discreteMode ? " · discrete" : ""}
                    {` · KYF ${kyf.grade}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[var(--accent)]">{formatMoney(asset.askingPrice)}</div>
                  <div className="text-xs text-[var(--muted)]">{inbound} inbound</div>
                </div>
              </Link>
            );
          })}
          {assets.length === 0 ? (
            <div className="surface p-6 text-sm text-[var(--muted)]">No assets yet. Publish your first listing.</div>
          ) : null}
        </div>
      </div>

      {heatmap.length ? (
        <div className="mb-10">
          <h2 className="mb-2 font-display text-2xl font-bold">Interest heatmap</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Repeated mandate gaps on {primaryAsset?.title} — fix these signals to convert more NDAs.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {heatmap.map((signal) => (
              <div key={signal.key} className="surface p-4">
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{signal.label}</div>
                <div className="mt-1 font-display text-2xl font-bold">{signal.count}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {rooms.length ? (
        <div className="mb-10">
          <h2 className="mb-3 font-display text-2xl font-bold">Inbound pipeline</h2>
          <div className="space-y-2">
            {rooms.slice(0, 8).map((room) => {
              const buyer = store.getUserById(room.buyerId);
              const asset = store.getAsset(room.assetId);
              return (
                <Link
                  key={room.id}
                  href={`/assets/${room.assetId}`}
                  className="surface surface-hover flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold">
                      {buyer?.name} · {buyerTrustLabel(buyer?.buyerProfile)}
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      {asset?.title} · {room.stage}
                    </div>
                  </div>
                  <span className="badge">{room.checklistDone.length} CoC done</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-2 font-display text-2xl font-bold">Serious buyer feed</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Only ID + funds verified buyers, ranked against {primaryAsset ? primaryAsset.title : "your inventory"}.
        </p>
        {rankedBuyers.length === 0 ? (
          <div className="surface p-5 text-sm text-[var(--muted)]">
            No serious buyers yet — ask inbound leads to complete Trust Gate on their profile.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rankedBuyers.map((buyer) => (
              <BuyerCard
                key={buyer.id}
                buyer={buyer}
                href={`/buyers/${buyer.id}`}
                matchScore={buyer.matchScore}
                matchReasons={buyer.matchReasons}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
