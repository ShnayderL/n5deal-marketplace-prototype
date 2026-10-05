import Image from "next/image";
import Link from "next/link";
import { AssetCard } from "@/components/cards";
import { getSession } from "@/lib/auth";
import { IMAGES } from "@/lib/images";
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
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-white">
        <div className="pointer-events-none absolute inset-0 grid-glow opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 pt-10 md:px-6 md:pt-14">
          <div className="grid gap-10 pb-12 md:grid-cols-2 md:items-center md:pb-16">
            <div>
              <p className="fade-up mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-2)]">
                M&A made simple, fast, and digital
              </p>
              <h1 className="font-display fade-up text-4xl font-bold leading-tight tracking-tight text-[var(--text)] md:text-5xl">
                Fintech & financial assets for sale
              </h1>
              <p className="fade-up-delay mt-4 max-w-lg text-lg text-[var(--muted)]">
                Structured deal discovery for buyers, sellers, and platform operators — licenses, regulated
                entities, and digital assets in one marketplace flow.
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
                  {session ? "Open dashboard" : "Start now"}
                </Link>
                <Link href="/assets" className="btn btn-secondary">
                  All Listings
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-[var(--border)] shadow-lg reveal reveal-delay-2 group">
              <Image
                src={IMAGES.hero}
                alt="Modern business district — M&A marketplace"
                fill
                className="img-zoom object-cover"
                priority
                sizes="(max-width:768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent-2)]/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <div className="group relative min-h-[200px] overflow-hidden rounded-2xl border border-[var(--border)] reveal reveal-delay-1">
            <Image src={IMAGES.handshake} alt="Business partnership" fill className="img-zoom object-cover" sizes="50vw" />
          </div>
          <div className="group relative min-h-[200px] overflow-hidden rounded-2xl border border-[var(--border)] reveal reveal-delay-2">
            <Image src={IMAGES.fintech} alt="Fintech analytics" fill className="img-zoom object-cover" sizes="50vw" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Published assets", value: String(assetCount) },
            { label: "Active buyers", value: String(buyerCount) },
            { label: "Active sellers", value: String(sellerCount) },
            { label: "Featured ask value", value: formatMoney(totalValue) },
          ].map((stat, i) => (
            <div key={stat.label} className={`surface p-5 reveal reveal-delay-${(i % 4) + 1}`}>
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{stat.label}</div>
              <div className="mt-2 font-display text-2xl font-bold text-[var(--text)]">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4 reveal-up">
            <div>
              <h2 className="font-display text-3xl font-bold text-[var(--text)]">Featured opportunities</h2>
              <p className="mt-2 text-[var(--muted)]">Curated from the seeded marketplace inventory.</p>
            </div>
            <Link href="/assets" className="btn btn-ghost">
              View all
            </Link>
          </div>
          <div className="grid items-stretch gap-4 md:grid-cols-3">
            {featured.map((asset, i) => (
              <div key={asset.id} className={`h-full reveal reveal-delay-${(i % 3) + 1}`}>
                <AssetCard asset={asset} imageIndex={i} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
