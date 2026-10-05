import Link from "next/link";
import { AssetCard } from "@/components/cards";
import { PageShell } from "@/components/ui";
import { scoreAssetForBuyer } from "@/lib/ai";
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
      return { ...asset, matchScore: score.score, matchReasons: score.reasons };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  const unread = store.countUnread(session.id);
  const profile = buyer?.buyerProfile;

  return (
    <PageShell
      title={`Welcome, ${session.name.split(" ")[0]}`}
      subtitle="Maintain your acquisition mandate, review AI-ranked assets, and contact sellers."
      actions={
        <>
          <Link href="/profile" className="btn btn-secondary">
            Edit mandate
          </Link>
          <Link href="/assets" className="btn btn-primary">
            Browse all assets
          </Link>
        </>
      }
    >
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Budget range</div>
          <div className="mt-2 font-display text-2xl font-bold">
            {profile ? `${formatMoney(profile.budgetMin)} – ${formatMoney(profile.budgetMax)}` : "Set profile"}
          </div>
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Focus</div>
          <div className="mt-2 text-sm leading-relaxed">
            {profile?.preferredCategories || "Add preferred categories"}
            <div className="mt-1 text-[var(--muted)]">{profile?.preferredJurisdictions}</div>
          </div>
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Unread messages</div>
          <div className="mt-2 font-display text-2xl font-bold">{unread}</div>
          <Link href="/messages" className="mt-2 inline-block text-sm text-[var(--accent)]">
            Open inbox →
          </Link>
        </div>
      </div>

      {profile ? (
        <div className="surface mb-8 p-5">
          <h2 className="font-display text-xl font-semibold">{profile.headline}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{profile.interests}</p>
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

      <div className="mb-4">
        <h2 className="font-display text-2xl font-bold">AI-ranked for you</h2>
        <p className="text-sm text-[var(--muted)]">Scored from category, jurisdiction, budget, and interest keywords.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {matched.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </PageShell>
  );
}
