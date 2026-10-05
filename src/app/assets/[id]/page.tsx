import Link from "next/link";
import { notFound } from "next/navigation";
import { setAssetStatusAction } from "@/app/actions";
import { ContactForm } from "@/components/forms";
import { PageShell } from "@/components/ui";
import { scoreAssetForBuyer } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import type { AssetStatus } from "@/lib/types";
import { formatDate, formatMoney, splitCsv } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export default async function AssetDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await getSession();
  const asset = store.getAsset(id);
  if (!asset) notFound();

  let match: { score: number; reasons: string[] } | null = null;
  if (session?.role === "BUYER") {
    const buyer = store.getUserById(session.id);
    if (buyer) {
      const scored = scoreAssetForBuyer(asset, buyer);
      match = { score: scored.score, reasons: scored.reasons };
    }
  }

  const canManage =
    session &&
    ((session.role === "SELLER" && session.id === asset.sellerId) || session.role === "MANAGER");

  return (
    <PageShell
      title={asset.title}
      subtitle={asset.summary}
      actions={
        <Link href="/assets" className="btn btn-ghost">
          Back to listings
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <div className="surface p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="badge badge-accent">{asset.category}</span>
              <span className="badge">{asset.jurisdiction}</span>
              <span className="badge">{asset.status}</span>
              <span className="badge badge-warn">{asset.dealReadiness}</span>
              {match ? <span className="badge badge-accent">{match.score}% AI match</span> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric label="Asking price" value={formatMoney(asset.askingPrice, asset.currency)} />
              <Metric
                label="Annual revenue"
                value={asset.annualRevenue ? formatMoney(asset.annualRevenue) : "n/a"}
              />
              <Metric label="Team" value={asset.employees != null ? String(asset.employees) : "n/a"} />
            </div>
            <div className="mt-6 whitespace-pre-wrap leading-relaxed">{asset.description}</div>
            <div className="mt-6 flex flex-wrap gap-2">
              {splitCsv(asset.tags).map((tag) => (
                <span key={tag} className="badge">
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-6 text-xs text-[var(--muted)]">Listed {formatDate(asset.createdAt)}</p>
          </div>

          {match ? (
            <div className="surface p-6">
              <h2 className="font-display text-xl font-semibold">Why this matches your mandate</h2>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {match.reasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
                {match.reasons.length === 0 ? <li>• Limited overlap with your current profile.</li> : null}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Seller</div>
            <h3 className="mt-1 font-display text-xl font-semibold">
              {asset.seller.company || asset.seller.name}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{asset.seller.sellerProfile?.bio}</p>
            {asset.seller.sellerProfile?.verified ? (
              <span className="badge badge-accent mt-3">Verified seller</span>
            ) : (
              <span className="badge mt-3">Unverified seller</span>
            )}
          </div>

          {session?.role === "BUYER" && asset.status === "PUBLISHED" ? (
            <ContactForm
              toUserId={asset.sellerId}
              assetId={asset.id}
              defaultSubject={`Interest in ${asset.title}`}
            />
          ) : null}

          {!session ? (
            <div className="surface p-5 text-sm text-[var(--muted)]">
              <Link href="/login" className="text-[var(--accent)]">
                Sign in as a Buyer
              </Link>{" "}
              to contact the seller.
            </div>
          ) : null}

          {canManage ? (
            <div className="surface space-y-3 p-5">
              <h3 className="font-display text-lg font-semibold">Manage listing</h3>
              <div className="flex flex-wrap gap-2">
                {(["PUBLISHED", "SUSPENDED", "DRAFT", "SOLD"] as AssetStatus[]).map((status) => (
                  <form
                    key={status}
                    action={async () => {
                      "use server";
                      await setAssetStatusAction(asset.id, status);
                    }}
                  >
                    <button className="btn btn-ghost" type="submit">
                      Mark {status}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
