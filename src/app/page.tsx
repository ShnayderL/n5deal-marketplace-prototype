import Link from "next/link";
import { AssetCard } from "@/components/cards";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

export default async function HomePage() {
  const session = await getSession();
  const assetCount = store.countAssets({ status: "PUBLISHED" });
  const buyerCount = store.countUsers({ role: "BUYER", status: "ACTIVE" });
  const sellerCount = store.countUsers({ role: "SELLER", status: "ACTIVE" });
  const featured = store
    .listAssets({ status: "PUBLISHED" })
    .sort((a, b) => b.askingPrice - a.askingPrice)
    .slice(0, 3);

  const totalValue = featured.reduce((sum, a) => sum + a.askingPrice, 0);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-glow opacity-60" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-16 md:px-6">
          <p className="fade-up mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            M&A marketplace · fintech & financial assets
          </p>
          <h1 className="font-display fade-up max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            N5<span className="text-[var(--accent)]">Deal</span>
          </h1>
          <p className="fade-up-delay mt-5 max-w-xl text-lg text-[var(--muted)] md:text-xl">
            Structured deal discovery for buyers, sellers, and platform operators — licenses,
            regulated entities, and digital financial assets in one flow.
          </p>
          <div className="fade-up-delay mt-8 flex flex-wrap gap-3">
            <Link
              href={
                session
                  ? session.role === "MANAGER"
                    ? "/manager"
                    : session.role === "SELLER"
                      ? "/seller"
                      : "/buyer"
                  : "/login"
              }
              className="btn btn-primary pulse-glow"
            >
              {session ? "Open dashboard" : "Enter as demo user"}
            </Link>
            <Link href="/assets" className="btn btn-secondary">
              Browse listings
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Published assets", value: String(assetCount) },
            { label: "Active buyers", value: String(buyerCount) },
            { label: "Active sellers", value: String(sellerCount) },
            { label: "Featured ask value", value: formatMoney(totalValue) },
          ].map((stat) => (
            <div key={stat.label} className="surface p-5">
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{stat.label}</div>
              <div className="mt-2 font-display text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold">Featured opportunities</h2>
              <p className="mt-2 text-[var(--muted)]">Curated from the seeded marketplace inventory.</p>
            </div>
            <Link href="/assets" className="btn btn-ghost">
              View all
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
