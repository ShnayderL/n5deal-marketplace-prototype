import Link from "next/link";
import { notFound } from "next/navigation";
import { grantExclusivityAction, setAssetDiscreteModeAction, setAssetStatusAction } from "@/app/actions";
import { DealRoomPanel } from "@/components/deal-room-panel";
import { ContactForm } from "@/components/forms";
import { KyfPanel } from "@/components/kyf-panel";
import { PageShell } from "@/components/ui";
import { scoreAssetForBuyer } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { cocProgress, getCocKit } from "@/lib/coc";
import { hasNdaAccess } from "@/lib/deals";
import { computeKyfReport } from "@/lib/kyf";
import { store } from "@/lib/store";
import type { AssetStatus } from "@/lib/types";
import { formatDate, formatMoney, splitCsv } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export default async function AssetDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await getSession();
  const asset = store.getAsset(id);
  if (!asset) notFound();

  const kyf = computeKyfReport(asset);
  const kit = getCocKit(asset.jurisdiction);

  const buyerRoom =
    session?.role === "BUYER" ? store.getDealRoom(asset.id, session.id) : null;
  const unlocked = !asset.discreteMode || hasNdaAccess(buyerRoom) || session?.id === asset.sellerId || session?.role === "MANAGER";

  let match: { score: number; reasons: string[]; gaps?: string[]; fitLabel?: string } | null = null;
  if (session?.role === "BUYER") {
    const buyer = store.getUserById(session.id);
    if (buyer) {
      const scored = scoreAssetForBuyer(asset, buyer);
      match = {
        score: scored.score,
        reasons: scored.reasons,
        gaps: scored.gaps,
        fitLabel: scored.fitLabel,
      };
    }
  }

  const canManage =
    session &&
    ((session.role === "SELLER" && session.id === asset.sellerId) || session.role === "MANAGER");

  const buyerProfile = session?.role === "BUYER" ? store.getUserById(session.id)?.buyerProfile : null;
  const progress = cocProgress(kit, buyerRoom?.checklistDone || []);

  const sellerRooms =
    session?.role === "SELLER" && session.id === asset.sellerId
      ? store.listDealRoomsForAsset(asset.id)
      : [];

  const displayTitle = unlocked ? asset.title : "Confidential regulated opportunity";
  const displaySummary = unlocked
    ? asset.summary
    : "Discrete listing — summary and seller identity unlock after mutual NDA.";
  const displayDescription = unlocked
    ? asset.description
    : "Full operational detail, CoC notes, and seller profile are gated until you register interest and sign the NDA. Teaser signals (KYF, banking, jurisdiction) remain visible so you can decide whether to engage.";

  return (
    <PageShell
      title={displayTitle}
      subtitle={displaySummary}
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
              <span className="badge badge-accent">
                KYF {kyf.grade} · {kyf.score}
              </span>
              {asset.discreteMode ? <span className="badge">Discrete</span> : null}
              {asset.exclusivityBuyerId ? <span className="badge badge-warn">Exclusive</span> : null}
              {match ? (
                <span className="badge badge-warn">
                  {match.score}% mandate · {match.fitLabel}
                </span>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric label="Asking price" value={formatMoney(asset.askingPrice, asset.currency)} />
              <Metric
                label="Annual revenue"
                value={unlocked && asset.annualRevenue ? formatMoney(asset.annualRevenue) : unlocked ? "n/a" : "Under NDA"}
              />
              <Metric
                label="Team"
                value={unlocked && asset.employees != null ? String(asset.employees) : unlocked ? "n/a" : "Under NDA"}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Banking"
                value={
                  asset.bankingStatus === "ACTIVE"
                    ? "Active"
                    : asset.bankingStatus === "IN_PROGRESS"
                      ? "In progress"
                      : "None"
                }
              />
              <Metric label="Entity" value={asset.entityType} />
              <Metric label="Passporting" value={asset.hasPassporting ? "Yes" : "No"} />
              <Metric label="Regulator" value={asset.regulator || "n/a"} />
            </div>
            <div className="mt-6 whitespace-pre-wrap leading-relaxed">{displayDescription}</div>
            {unlocked && asset.changeOfControlNotes ? (
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Change of control
                </div>
                <p className="mt-2 text-sm leading-relaxed">{asset.changeOfControlNotes}</p>
              </div>
            ) : null}
            {unlocked && asset.servicesInScope ? (
              <div className="mt-4 text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">Services: </span>
                {asset.servicesInScope}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              {unlocked
                ? splitCsv(asset.tags).map((tag) => (
                    <span key={tag} className="badge">
                      {tag}
                    </span>
                  ))
                : null}
              {asset.hasComplianceOfficer ? <span className="badge badge-accent">MLRO / CO</span> : null}
              {asset.hasLocalDirector ? <span className="badge">Local director</span> : null}
            </div>
            <p className="mt-6 text-xs text-[var(--muted)]">Listed {formatDate(asset.createdAt)}</p>
          </div>

          <KyfPanel report={kyf} />

          {match ? (
            <div className="surface p-6">
              <h2 className="font-display text-xl font-semibold">Mandate Matcher</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {match.fitLabel} — scored against your acquisition mandate.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {match.reasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
                {match.reasons.length === 0 ? <li>• Limited overlap with your current profile.</li> : null}
              </ul>
              {match.gaps?.length ? (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">Gaps</div>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                    {match.gaps.map((g) => (
                      <li key={g}>• {g}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Seller</div>
            {unlocked ? (
              <>
                <h3 className="mt-1 font-display text-xl font-semibold">
                  {asset.seller.company || asset.seller.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{asset.seller.sellerProfile?.bio}</p>
                {asset.seller.sellerProfile?.verified ? (
                  <span className="badge badge-accent mt-3">Verified seller</span>
                ) : (
                  <span className="badge mt-3">Unverified seller</span>
                )}
              </>
            ) : (
              <>
                <h3 className="mt-1 font-display text-xl font-semibold">Confidential seller</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Identity disclosed after NDA — protects live banking relationships during soft marketing.
                </p>
              </>
            )}
          </div>

          {session?.role === "BUYER" && asset.status === "PUBLISHED" ? (
            <DealRoomPanel
              assetId={asset.id}
              room={buyerRoom}
              kit={kit}
              progress={progress}
              canSignNda={Boolean(buyerProfile?.identityVerified)}
              trustHint={
                buyerProfile?.fundsVerified
                  ? "Funds verified — seller will see you as a serious buyer."
                  : "Tip: verify funds in Profile to jump the seller queue."
              }
            />
          ) : null}

          {session?.role === "BUYER" && asset.status === "PUBLISHED" && unlocked ? (
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
              to open a Deal Room and contact the seller.
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
              <form
                action={async () => {
                  "use server";
                  await setAssetDiscreteModeAction(asset.id, !asset.discreteMode);
                }}
              >
                <button className="btn btn-secondary" type="submit">
                  {asset.discreteMode ? "Disable discrete mode" : "Enable discrete mode"}
                </button>
              </form>

              {sellerRooms.length ? (
                <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                  <h4 className="font-semibold">Inbound Deal Rooms</h4>
                  {sellerRooms.map((room) => {
                    const buyer = store.getUserById(room.buyerId);
                    return (
                      <div key={room.id} className="rounded-xl border border-[var(--border)] p-3 text-sm">
                        <div className="font-medium">
                          {buyer?.name} · {buyer?.company}
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          Stage {room.stage}
                          {buyer?.buyerProfile?.fundsVerified
                            ? ` · funds ${formatMoney(buyer.buyerProfile.verifiedFundsAmount || 0)}`
                            : " · funds unverified"}
                        </div>
                        {room.stage !== "INTERESTED" ? (
                          <form
                            className="mt-2"
                            action={async () => {
                              "use server";
                              await grantExclusivityAction(asset.id, room.buyerId);
                            }}
                          >
                            <button className="btn btn-ghost !py-1 text-xs" type="submit">
                              Grant 14-day exclusivity
                            </button>
                          </form>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
