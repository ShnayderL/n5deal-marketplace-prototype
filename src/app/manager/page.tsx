import { removeParticipantAction, setAssetStatusAction, setUserStatusAction } from "@/app/actions";
import { PageShell } from "@/components/ui";
import { guardSession } from "@/lib/guards";
import { store } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

type SearchParams = Promise<{ q?: string }>;

export default async function ManagerPage({ searchParams }: { searchParams: SearchParams }) {
  await guardSession(["MANAGER"]);
  const params = await searchParams;
  const q = params.q?.trim();

  const buyers = store.listUsers({ role: "BUYER", q });
  const sellers = store.listUsers({ role: "SELLER", q });
  const assets = store.listAssets({ q });

  return (
    <PageShell
      title="Platform control room"
      subtitle="Oversee buyers, sellers, and assets. Suspend non-compliant participants or take listings offline."
    >
      <form className="surface mb-6 flex flex-col gap-3 p-4 sm:flex-row" action="/manager" method="get">
        <input className="input" name="q" defaultValue={params.q} placeholder="Search participants or assets…" />
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Stat label="Buyers" value={String(buyers.length)} />
        <Stat label="Sellers" value={String(sellers.length)} />
        <Stat label="Assets" value={String(assets.length)} />
        <Stat
          label="Suspended users"
          value={String([...buyers, ...sellers].filter((u) => u.status === "SUSPENDED").length)}
        />
      </div>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-2xl font-bold">Buyers</h2>
        <div className="space-y-3">
          {buyers.map((buyer) => (
            <div key={buyer.id} className="surface flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold">
                  {buyer.name}{" "}
                  <span className={`badge ${buyer.status === "SUSPENDED" ? "badge-danger" : "badge-accent"}`}>
                    {buyer.status}
                  </span>
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {buyer.email} · {buyer.company} · {buyer.buyerProfile?.headline}
                </div>
              </div>
              <ManagerUserActions userId={buyer.id} status={buyer.status} />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-2xl font-bold">Sellers</h2>
        <div className="space-y-3">
          {sellers.map((seller) => (
            <div key={seller.id} className="surface flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold">
                  {seller.name}{" "}
                  <span className={`badge ${seller.status === "SUSPENDED" ? "badge-danger" : "badge-accent"}`}>
                    {seller.status}
                  </span>
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {seller.email} · {seller.company} · {seller.assets.length} assets
                </div>
              </div>
              <ManagerUserActions userId={seller.id} status={seller.status} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold">Assets</h2>
        <div className="space-y-3">
          {assets.map((asset) => (
            <div key={asset.id} className="surface flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold">
                  {asset.title} <span className="badge">{asset.status}</span>
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {asset.category} · {asset.jurisdiction} · {formatMoney(asset.askingPrice)} ·{" "}
                  {asset.seller.company || asset.seller.name}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <form
                  action={async () => {
                    "use server";
                    await setAssetStatusAction(asset.id, "PUBLISHED");
                  }}
                >
                  <button className="btn btn-ghost" type="submit">
                    Publish
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await setAssetStatusAction(asset.id, "SUSPENDED");
                  }}
                >
                  <button className="btn btn-danger" type="submit">
                    Suspend
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-5">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function ManagerUserActions({
  userId,
  status,
}: {
  userId: string;
  status: "ACTIVE" | "SUSPENDED";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === "ACTIVE" ? (
        <form
          action={async () => {
            "use server";
            await setUserStatusAction(userId, "SUSPENDED");
          }}
        >
          <button className="btn btn-danger" type="submit">
            Suspend
          </button>
        </form>
      ) : (
        <form
          action={async () => {
            "use server";
            await setUserStatusAction(userId, "ACTIVE");
          }}
        >
          <button className="btn btn-secondary" type="submit">
            Reinstate
          </button>
        </form>
      )}
      <form
        action={async () => {
          "use server";
          await removeParticipantAction(userId);
        }}
      >
        <button className="btn btn-ghost" type="submit">
          Remove
        </button>
      </form>
    </div>
  );
}
