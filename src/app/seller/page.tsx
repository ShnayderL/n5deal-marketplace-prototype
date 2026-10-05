import Link from "next/link";
import { redirect } from "next/navigation";
import { BuyerCard } from "@/components/cards";
import { PageShell } from "@/components/ui";
import { scoreBuyerForAsset } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

export default async function SellerDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SELLER") redirect("/");

  const assets = store.listAssets({ sellerId: session.id });
  const buyers = store.listUsers({ role: "BUYER", status: "ACTIVE" });
  const unread = store.countUnread(session.id);
  const primaryAsset = assets.find((a) => a.status === "PUBLISHED") || assets[0];

  const rankedBuyers = primaryAsset
    ? buyers
        .map((buyer) => {
          const match = scoreBuyerForAsset(buyer, primaryAsset);
          return { ...buyer, matchScore: match.score, matchReasons: match.reasons };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4)
    : buyers.slice(0, 4).map((b) => ({ ...b, matchScore: undefined as number | undefined, matchReasons: undefined as string[] | undefined }));

  return (
    <PageShell
      title="Seller workspace"
      subtitle="Publish assets, find matched buyers, and manage inbound interest."
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
      <div className="mb-8 grid gap-4 md:grid-cols-3">
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
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Unread messages</div>
          <div className="mt-2 font-display text-2xl font-bold">{unread}</div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="mb-4 font-display text-2xl font-bold">Your assets</h2>
        <div className="space-y-3">
          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
              className="surface surface-hover flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-semibold">{asset.title}</div>
                <div className="text-sm text-[var(--muted)]">
                  {asset.category} · {asset.jurisdiction} · {asset.status}
                </div>
              </div>
              <div className="font-semibold text-[var(--accent)]">{formatMoney(asset.askingPrice)}</div>
            </Link>
          ))}
          {assets.length === 0 ? (
            <div className="surface p-6 text-sm text-[var(--muted)]">No assets yet. Publish your first listing.</div>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-display text-2xl font-bold">Suggested buyers</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Ranked against {primaryAsset ? primaryAsset.title : "your inventory"}.
        </p>
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
      </div>
    </PageShell>
  );
}
