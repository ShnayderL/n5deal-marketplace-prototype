import Link from "next/link";
import { AssetCard } from "@/components/cards";
import { PageShell } from "@/components/ui";
import { scoreAssetForBuyer } from "@/lib/ai";
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
      return { ...asset, matchScore: score.score, matchReasons: score.reasons, gaps: score.gaps };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  const unread = store.countUnread(session.id);
  const profile = buyer?.buyerProfile;
  const topKyf = matched[0] ? computeKyfReport(matched[0]) : null;

  return (
    <PageShell
      title={`Welcome, ${session.name.split(" ")[0]}`}
      subtitle="Mandate Matcher ranks assets on banking, passporting, services, and budget — not just category keywords."
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
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Budget range</div>
          <div className="mt-2 font-display text-2xl font-bold">
            {profile ? `${formatMoney(profile.budgetMin)} – ${formatMoney(profile.budgetMax)}` : "Set profile"}
          </div>
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Mandate filters</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {profile?.requiresBanking ? <span className="badge badge-accent">Banking</span> : <span className="badge">Banking optional</span>}
            {profile?.requiresPassporting ? <span className="badge badge-accent">Passporting</span> : <span className="badge">Passporting optional</span>}
          </div>
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Top KYF fit</div>
          <div className="mt-2 font-display text-2xl font-bold">
            {topKyf ? `${topKyf.grade} · ${topKyf.score}` : "—"}
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

      <div className="mb-4">
        <h2 className="font-display text-2xl font-bold">Mandate-ranked for you</h2>
        <p className="text-sm text-[var(--muted)]">
          Scored from license fit, jurisdiction, budget, banking continuity, passporting, and services overlap.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {matched.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </PageShell>
  );
}
