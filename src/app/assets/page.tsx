import Link from "next/link";
import { ArrowUpDown, Banknote, BadgeCheck, Building2, Globe, UserCheck } from "lucide-react";
import { AssetCard } from "@/components/cards";
import { Flag } from "@/components/flag";
import { AssetFilters } from "@/components/forms";
import { EmptyState } from "@/components/ui";
import { parseSmartQuery, scoreAssetForBuyer } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { CATEGORIES, JURISDICTIONS } from "@/lib/constants";
import { computeKyfReport } from "@/lib/kyf";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";

type Params = {
  q?: string;
  category?: string;
  jurisdiction?: string;
  smart?: string;
  banking?: string;
  passporting?: string;
  mlro?: string;
  grade?: string;
  entity?: string;
  sort?: string;
};

const SIGNAL_CHIPS = [
  { key: "banking", value: "active", label: "Active banking", icon: Banknote },
  { key: "passporting", value: "1", label: "EEA/UK passporting", icon: Globe },
  { key: "mlro", value: "1", label: "MLRO + local director", icon: UserCheck },
  { key: "grade", value: "AB", label: "KYF grade A–B", icon: BadgeCheck },
  { key: "entity", value: "OPERATIONAL", label: "Operational only", icon: Building2 },
] as const;

const SIGNAL_KEYS = ["banking", "passporting", "mlro", "grade", "entity", "sort"] as const;

function hrefWith(params: Params, patch: Partial<Params>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...patch })) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/assets?${qs}` : "/assets";
}

export default async function AssetsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const session = await getSession();
  const smart = params.smart ? parseSmartQuery(params.smart) : null;
  const allPublished = store.listAssets({ status: "PUBLISHED" });

  let assets = store.listAssets({
    status: "PUBLISHED",
    q: params.q,
    category: params.category || smart?.categories[0],
    jurisdiction: params.jurisdiction || smart?.jurisdictions[0],
    minPrice: smart?.minPrice,
    maxPrice: smart?.maxPrice,
  });

  if (smart && smart.categories.length > 1) {
    assets = assets.filter((a) =>
      smart.categories.some((c) => c.toLowerCase() === a.category.toLowerCase()),
    );
  }
  if (smart && smart.jurisdictions.length > 1) {
    assets = assets.filter((a) =>
      smart.jurisdictions.some((j) => j.toLowerCase() === a.jurisdiction.toLowerCase()),
    );
  }
  if (smart?.bankingRequired || params.banking === "active") {
    assets = assets.filter((a) => a.bankingStatus === "ACTIVE");
  }
  if (smart?.passportingRequired || params.passporting) {
    assets = assets.filter((a) => a.hasPassporting);
  }
  if (params.mlro) {
    assets = assets.filter((a) => a.hasComplianceOfficer && a.hasLocalDirector);
  }
  if (params.entity === "OPERATIONAL") {
    assets = assets.filter((a) => a.entityType === "OPERATIONAL");
  }
  if (params.grade === "AB") {
    assets = assets.filter((a) => ["A", "B"].includes(computeKyfReport(a).grade));
  }

  const buyer = session?.role === "BUYER" ? store.getUserById(session.id) : null;
  const canFit = Boolean(buyer?.buyerProfile);
  const sort = params.sort || (canFit ? "fit" : "kyf");

  const enriched = assets.map((asset) => {
    const match = canFit && buyer ? scoreAssetForBuyer(asset, buyer) : null;
    return {
      ...asset,
      kyf: computeKyfReport(asset).score,
      matchScore: match?.score,
      matchReasons: match?.reasons,
    };
  });

  enriched.sort((a, b) => {
    if (sort === "price") return a.askingPrice - b.askingPrice;
    if (sort === "fit" && canFit) return (b.matchScore || 0) - (a.matchScore || 0);
    return b.kyf - a.kyf;
  });

  const avgKyf = allPublished.length
    ? Math.round(allPublished.reduce((s, a) => s + computeKyfReport(a).score, 0) / allPublished.length)
    : 0;
  const stats = [
    { v: String(allPublished.length), l: "Pre-scored entities" },
    { v: `${avgKyf}/100`, l: "Avg. KYF readiness" },
    { v: String(allPublished.filter((a) => a.bankingStatus === "ACTIVE").length), l: "With active banking" },
    { v: String(allPublished.filter((a) => a.discreteMode).length), l: "Discrete / NDA-gated" },
  ];
  const markets = [...allPublished.reduce((m, a) => m.set(a.jurisdiction, (m.get(a.jurisdiction) || 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);
  const activeSignals = SIGNAL_CHIPS.filter((c) => params[c.key] === c.value).length;
  const sortOptions = [
    { id: "kyf", label: "KYF readiness" },
    ...(canFit ? [{ id: "fit", label: "Mandate fit" }] : []),
    { id: "price", label: "Price ↑" },
  ];

  return (
    <>
      <section className="hero-dark overflow-hidden">
        <div className="grid-lines-dark pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6">
          <p className="text-xs text-white/50">
            <Link href="/" className="hover:text-white">
              N5Deal
            </Link>{" "}
            › Licensed entities
          </p>
          <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
                Licensed entities, pre-scored for deal readiness
              </h1>
              <p className="mt-2 max-w-2xl text-white/65">
                Filter by the signals that decide regulated deals — banking, compliance substance, passporting and
                KYF grade. {canFit ? "Sorted by fit to your mandate." : "Sign in as a buyer to rank by mandate fit."}
              </p>
            </div>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-white/50">{s.l}</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-white">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Must have</span>
            {SIGNAL_CHIPS.map(({ key, value, label, icon: Icon }) => {
              const active = params[key] === value;
              return (
                <Link
                  key={key}
                  href={hrefWith(params, { [key]: active ? undefined : value })}
                  className={cn("chip", active && "chip-active")}
                  scroll={false}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
            {activeSignals ? (
              <Link
                href={hrefWith(params, { banking: undefined, passporting: undefined, mlro: undefined, grade: undefined, entity: undefined })}
                className="text-xs font-semibold text-[var(--accent-2)] hover:underline"
                scroll={false}
              >
                Clear signals
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Market</span>
            {markets.map(([j, count]) => {
              const active = params.jurisdiction === j;
              return (
                <Link
                  key={j}
                  href={hrefWith(params, { jurisdiction: active ? undefined : j })}
                  className={cn("chip", active && "chip-active")}
                  scroll={false}
                >
                  <Flag jurisdiction={j} size={18} />
                  {j}
                  <span className={active ? "text-white/60" : "text-[var(--muted)]"}>{count}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              <ArrowUpDown className="h-3 w-3" /> Sort
            </span>
            {sortOptions.map((o) => (
              <Link
                key={o.id}
                href={hrefWith(params, { sort: o.id })}
                className={cn("chip", sort === o.id && "chip-active")}
                scroll={false}
              >
                {o.label}
              </Link>
            ))}
          </div>
        </div>

        <AssetFilters
          categories={[...CATEGORIES]}
          jurisdictions={[...JURISDICTIONS]}
          initial={{
            q: params.q,
            category: params.category,
            jurisdiction: params.jurisdiction,
            smart: params.smart,
          }}
          preserve={Object.fromEntries(SIGNAL_KEYS.map((k) => [k, params[k]]))}
        />

        {smart ? (
          <div className="rounded-2xl border border-[var(--border)] bg-blue-50 px-4 py-3 text-sm text-[var(--muted)]">
            AI interpreted:{" "}
            {[
              smart.categories.length ? `categories ${smart.categories.join(", ")}` : null,
              smart.jurisdictions.length ? `jurisdictions ${smart.jurisdictions.join(", ")}` : null,
              smart.minPrice ? `min ${smart.minPrice}` : null,
              smart.maxPrice ? `max ${smart.maxPrice}` : null,
              smart.bankingRequired ? "active banking" : null,
              smart.passportingRequired ? "passporting" : null,
            ]
              .filter(Boolean)
              .join(" · ") || "keyword search only"}
          </div>
        ) : null}

        <p className="text-sm text-[var(--muted)]">
          <b className="text-[var(--text)]">{enriched.length}</b> of {allPublished.length} entities match
          {activeSignals ? ` · ${activeSignals} signal filter${activeSignals > 1 ? "s" : ""} on` : ""}
        </p>

        {enriched.length === 0 ? (
          <EmptyState
            title="No entities pass these signals"
            body="Relax a must-have (e.g. accept banking in progress) or try the instant shortlist on the homepage."
          />
        ) : (
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {enriched.map((asset) => (
              <div key={asset.id} className="h-full">
                <AssetCard asset={asset} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
