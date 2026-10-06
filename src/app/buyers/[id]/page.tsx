import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ContactForm } from "@/components/forms";
import { PageShell } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { formatMoney, splitCsv } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export default async function BuyerDetailPage({ params }: { params: Params }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SELLER" && session.role !== "MANAGER") redirect("/");

  const { id } = await params;
  const buyer = store.getUserById(id);
  if (!buyer || buyer.role !== "BUYER") notFound();
  const profile = buyer.buyerProfile;

  return (
    <PageShell
      title={buyer.name}
      subtitle={buyer.company || "Independent buyer"}
      actions={
        <Link href="/buyers" className="btn btn-ghost">
          Back to buyers
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="surface space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            {profile?.verified ? <span className="badge badge-accent">Verified</span> : <span className="badge">Unverified</span>}
            {profile?.identityVerified && profile?.fundsVerified ? (
              <span className="badge badge-accent">Serious buyer</span>
            ) : null}
            {profile?.identityVerified ? <span className="badge">ID verified</span> : null}
            {profile?.fundsVerified ? (
              <span className="badge">Funds {formatMoney(profile.verifiedFundsAmount || 0)}</span>
            ) : null}
            <span className="badge">{buyer.status}</span>
          </div>
          <h2 className="font-display text-2xl font-semibold">{profile?.headline || "No headline yet"}</h2>
          <p className="text-[var(--muted)]">{profile?.interests}</p>
          {profile ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Budget" value={`${formatMoney(profile.budgetMin)} – ${formatMoney(profile.budgetMax)}`} />
              <Info label="Note" value={profile.ticketNote || "—"} />
              <Info label="Categories" value={splitCsv(profile.preferredCategories).join(", ")} />
              <Info label="Jurisdictions" value={splitCsv(profile.preferredJurisdictions).join(", ")} />
              <Info label="Requires banking" value={profile.requiresBanking ? "Yes" : "No"} />
              <Info label="Requires passporting" value={profile.requiresPassporting ? "Yes" : "No"} />
              <Info label="Services needed" value={profile.servicesNeeded || "—"} />
              <Info label="Timeline" value={profile.timelineWeeks ? `${profile.timelineWeeks} weeks` : "—"} />
            </div>
          ) : null}
        </div>

        {session.role === "SELLER" && buyer.status === "ACTIVE" ? (
          <ContactForm toUserId={buyer.id} defaultSubject={`Opportunity for ${buyer.name}`} />
        ) : (
          <div className="surface p-5 text-sm text-[var(--muted)]">
            Managers can review buyer profiles here. Contact messaging is reserved for sellers.
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
