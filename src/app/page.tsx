import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Clock,
  EyeOff,
  FileCheck,
  Globe,
  Handshake,
  Landmark,
  Search,
  ShieldCheck,
  Timer,
  UserCheck,
} from "lucide-react";
import { AssetCard } from "@/components/cards";
import { Flag } from "@/components/flag";
import { InstantShortlist } from "@/components/instant-shortlist";
import { PartnersSection } from "@/components/partners";
import { getSession } from "@/lib/auth";
import { getCocKit } from "@/lib/coc";
import { IMAGES } from "@/lib/images";
import { computeKyfReport } from "@/lib/kyf";
import { buildShortlist, DEFAULT_SHORTLIST_INPUT } from "@/lib/shortlist";
import { store } from "@/lib/store";

const SIGNALS = [
  { icon: Banknote, title: "Banking continuity", body: "Active accounts, SEPA / IBAN rails and re-KYC path flagged per entity." },
  { icon: Landmark, title: "Regulatory standing", body: "Named supervisor, licence scope and open-matter disclosure up front." },
  { icon: UserCheck, title: "Compliance substance", body: "MLRO and local director confirmed — the people regulators approve." },
  { icon: Globe, title: "Passporting scope", body: "EEA / UK cross-border rights mapped to your target markets." },
  { icon: FileCheck, title: "Change-of-control path", body: "Filing route, supervisor and typical timeline before you sign an NDA." },
];

const STEPS = [
  { icon: Search, title: "Mandate", body: "Licence family, jurisdiction, budget, banking must-haves.", tag: "2 min" },
  { icon: BadgeCheck, title: "Scored shortlist", body: "2–5 entities ranked by mandate fit × KYF readiness.", tag: "Instant" },
  { icon: ShieldCheck, title: "Trust Gate + NDA", body: "Verified ID & funds unlock discrete listings and seller identity.", tag: "Same day" },
  { icon: FileCheck, title: "CoC kit", body: "Jurisdiction checklist: UBO chart, fit & proper, banking re-KYC.", tag: "Guided" },
  { icon: Handshake, title: "LOI & exclusivity", body: "Seller grants exclusivity once critical CoC items are complete.", tag: "Weeks" },
];

const LIVE_MARKETS = ["Lithuania", "Estonia", "UK", "Germany", "Spain", "UAE", "Singapore"];

const FEATURED_JURISDICTIONS = ["Lithuania", "Estonia", "UK", "Germany", "Spain", "Cyprus", "UAE", "Singapore"];

export default async function HomePage() {
  const session = await getSession();
  const assets = store.listAssets({ status: "PUBLISHED" });
  const reports = new Map(assets.map((a) => [a.id, computeKyfReport(a)]));
  const avgKyf = assets.length
    ? Math.round(assets.reduce((s, a) => s + (reports.get(a.id)?.score || 0), 0) / assets.length)
    : 0;
  const bankingActive = assets.filter((a) => a.bankingStatus === "ACTIVE").length;
  const jurisdictionCount = new Set(assets.map((a) => a.jurisdiction)).size;
  const seriousBuyers = store
    .listUsers({ role: "BUYER", status: "ACTIVE" })
    .filter((b) => b.buyerProfile?.identityVerified && b.buyerProfile?.fundsVerified).length;
  const dealRooms = assets.reduce((s, a) => s + store.listDealRoomsForAsset(a.id).length, 0);
  const dealReady = [...assets]
    .sort((a, b) => (reports.get(b.id)?.score || 0) - (reports.get(a.id)?.score || 0))
    .slice(0, 3);
  const initialShortlist = buildShortlist(assets, DEFAULT_SHORTLIST_INPUT);

  const dashboardHref = session
    ? session.role === "MANAGER"
      ? "/manager"
      : session.role === "SELLER"
        ? "/seller"
        : "/buyer"
    : "/login?role=buyer";

  return (
    <div>
      {/* HERO — value proposition + live shortlist on first contact */}
      <section className="hero-dark overflow-hidden">
        <div className="grid-lines-dark pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:py-16">
          <div>
            <div className="fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              MiCA & PSD3 window open — authorised entities are scarce
            </div>
            <h1 className="font-display fade-up mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-[3.4rem]">
              Buy a licensed fintech in <span className="text-emerald-400">weeks</span>, not years.
            </h1>
            <p className="fade-up-delay mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Pre-scored EMI, PI, CASP and VASP entities with banking, compliance and change-of-control
              signals verified <b className="text-white">before</b> you sign an NDA. Shortlists, not catalogues.
            </p>

            <ul className="fade-up-delay mt-6 grid gap-2 text-sm text-white/80 sm:grid-cols-2">
              {[
                "Banking continuity checked",
                "CoC path per regulator",
                "Verified-funds buyers only",
                "Discrete, NDA-gated listings",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                  {t}
                </li>
              ))}
            </ul>

            <div className="fade-up-delay mt-8 flex flex-wrap gap-3">
              <a href="#shortlist" className="btn btn-primary pulse-glow">
                Get my shortlist <ArrowRight className="h-4 w-4" />
              </a>
              <Link href={session ? dashboardHref : "/login?role=seller"} className="btn btn-on-dark">
                {session ? "Open dashboard" : "Sell discreetly"}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {IMAGES.advisors.slice(0, 4).map((src) => (
                    <Image
                      key={src}
                      src={src}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full border-2 border-[#0a1222] object-cover"
                    />
                  ))}
                </div>
                <div className="text-xs leading-tight text-white/70">
                  <b className="block text-sm text-white">Dedicated deal advisors</b>
                  Avg. first reply under 2 hours
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {LIVE_MARKETS.map((j) => (
                  <Flag key={j} jurisdiction={j} size={22} className="shadow-[0_0_0_1px_rgba(255,255,255,0.25)]" />
                ))}
                <span className="ml-1.5 text-xs text-white/60">live markets</span>
              </div>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-4">
              {[
                { v: String(assets.length), l: "Pre-scored entities" },
                { v: `${avgKyf}/100`, l: "Avg. KYF readiness" },
                { v: `${bankingActive}/${assets.length}`, l: "With active banking" },
                { v: String(jurisdictionCount), l: "Jurisdictions" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="text-[11px] uppercase tracking-wide text-white/50">{s.l}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-white">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="reveal reveal-delay-2">
            <InstantShortlist initial={initialShortlist} ctaHref={dashboardHref} />
          </div>
        </div>
      </section>

      {/* SIGNAL STRIP */}
      <section className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-2)]">KYF Deal Readiness</p>
              <h2 className="mt-2 font-display text-3xl font-bold">Every entity is scored before you ever see it</h2>
            </div>
            <p className="max-w-md text-sm text-[var(--muted)]">
              Five signals that actually kill regulated deals — surfaced on every listing, not buried in a data room.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SIGNALS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className={`rounded-2xl border border-[var(--border)] p-4 reveal reveal-delay-${(i % 4) + 1}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--nav-pill)] text-white">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            <span className="text-[var(--text)]">Supervisors covered</span>
            {["Bank of Lithuania", "FCA", "CySEC", "MFSA", "BaFin", "MAS", "DIFC", "Bank of Spain"].map((r) => (
              <span key={r}>{r}</span>
            ))}
          </div>
        </div>
      </section>

      <PartnersSection />

      {/* ACQUIRE VS APPLY */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-2)]">Acquire, don&apos;t apply</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Time to market is the asset you are really buying</h2>
            <p className="mt-3 max-w-xl text-[var(--muted)]">
              A fresh EMI or CASP authorisation means 12–24 months of applications, capital lock-up and banking
              onboarding. An existing licensed entity moves through a change-of-control filing instead.
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold">Fresh licence application</span>
                  <span className="text-[var(--muted)]">12–24 months</span>
                </div>
                <div className="h-3 rounded-full bg-[var(--bg-soft)]">
                  <div className="h-3 w-full rounded-full bg-slate-300" />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold">Acquisition via N5Deal + CoC</span>
                  <span className="font-semibold text-[var(--success)]">4–16 weeks</span>
                </div>
                <div className="h-3 rounded-full bg-[var(--bg-soft)]">
                  <div className="h-3 w-[18%] rounded-full bg-emerald-500" />
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Typical ranges from public EU/UK change-of-control guidance; actual timelines depend on the supervisor and acquirer profile.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { k: "€100k–300k", l: "Clean EU licence, no live banking", n: "Shelf / dormant entities" },
              { k: "€2M–6M+", l: "Operational EMI with banking & cards", n: "Priced on strategic value" },
              { k: "Jul 2026", l: "MiCA transitional period ends", n: "Only authorised CASPs keep operating" },
              { k: "PSD3", l: "New payments rulebook incoming", n: "Existing EMI/PI authorisations carry value" },
            ].map((c) => (
              <div key={c.l} className="surface p-5">
                <div className="font-display text-2xl font-bold text-[var(--text)]">{c.k}</div>
                <div className="mt-1 text-sm font-medium">{c.l}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">{c.n}</div>
              </div>
            ))}
            <p className="text-[11px] text-[var(--muted)] sm:col-span-2">
              Market references: 2026 EU payment-entity buyer guides and the ESMA CASP register.
            </p>
          </div>
        </div>
      </section>

      {/* DEAL-READY NOW */}
      <section className="border-y border-[var(--border)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-2)]">Deal-ready now</p>
              <h2 className="mt-2 font-display text-3xl font-bold">Highest KYF readiness this week</h2>
            </div>
            <Link href="/assets" className="btn btn-ghost">
              All {assets.length} entities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid items-stretch gap-4 md:grid-cols-3">
            {dealReady.map((asset, i) => (
              <div key={asset.id} className={`h-full reveal reveal-delay-${(i % 3) + 1}`}>
                <AssetCard asset={asset} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-2)]">Regulated deal path</p>
        <h2 className="mt-2 font-display text-3xl font-bold">From mandate to LOI in one workspace</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, body, tag }, i) => (
            <li key={title} className="relative rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--muted)]">0{i + 1}</span>
                <span className="badge">{tag}</span>
              </div>
              <Icon className="mt-4 h-6 w-6 text-[var(--accent-2)]" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { v: String(seriousBuyers), l: "Verified-funds buyers active" },
            { v: String(dealRooms), l: "Deal Rooms in progress" },
            { v: "14 days", l: "Standard exclusivity window" },
          ].map((s) => (
            <div key={s.l} className="flex items-center gap-3 rounded-2xl bg-[var(--bg-soft)] px-4 py-3">
              <span className="font-display text-2xl font-bold">{s.v}</span>
              <span className="text-sm text-[var(--muted)]">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* DEAL DESK */}
      <section className="mx-auto max-w-6xl px-4 pb-14 md:px-6">
        <div className="grid overflow-hidden rounded-[22px] border border-[var(--border)] bg-white lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[320px]">
            <Image src={IMAGES.boardroom} alt="N5Deal deal desk reviewing a change-of-control file" fill className="object-cover" sizes="(min-width: 1024px) 640px, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1222]/90 via-[#0a1222]/30 to-transparent" />
            <blockquote className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="max-w-lg font-display text-xl font-semibold leading-snug">
                “We had a passportable Lithuanian EMI with live IBANs under LOI in five weeks — the CoC pack was
                ready before the first call.”
              </p>
              <footer className="mt-3 flex items-center gap-2 text-sm text-white/75">
                <Flag jurisdiction="Lithuania" size={18} /> Head of M&A, European payments group
              </footer>
            </blockquote>
          </div>
          <div className="p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-2)]">Your deal desk</p>
            <h3 className="mt-2 font-display text-2xl font-bold">Advisors who have run regulated deals</h3>
            <ul className="mt-5 space-y-4">
              {[
                { name: "Daniel Whitmore", role: "UK & FCA change of control", j: "UK" },
                { name: "Ieva Kazlauskė", role: "Bank of Lithuania EMI / PI", j: "Lithuania" },
                { name: "Marco Lindqvist", role: "MiCA CASP & Estonian VASP", j: "Estonia" },
                { name: "Sofia Almeida", role: "Banking continuity & re-KYC", j: "Spain" },
                { name: "Omar Haddad", role: "DIFC / ADGM & MENA", j: "UAE" },
              ].map((a, i) => (
                <li key={a.name} className="flex items-center gap-3">
                  <Image src={IMAGES.advisors[i]} alt={a.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{a.name}</div>
                    <div className="truncate text-xs text-[var(--muted)]">{a.role}</div>
                  </div>
                  <Flag jurisdiction={a.j} size={22} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* JURISDICTION INTELLIGENCE */}
      <section id="jurisdictions" className="scroll-mt-24 border-y border-[var(--border)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-2)]">Jurisdiction intelligence</p>
              <h2 className="mt-2 font-display text-3xl font-bold">Know the change-of-control route before you shortlist</h2>
            </div>
            <p className="max-w-sm text-sm text-[var(--muted)]">
              Supervisor, typical filing time and live inventory for each market.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED_JURISDICTIONS.map((j) => {
              const kit = getCocKit(j);
              const count = assets.filter((a) => a.jurisdiction === j).length;
              return (
                <Link
                  key={j}
                  href={`/assets?jurisdiction=${encodeURIComponent(j)}`}
                  className="group rounded-2xl border border-[var(--border)] p-4 transition hover:border-[var(--accent-2)]/40 hover:bg-[var(--bg-soft)]"
                >
                  <div className="flex items-center justify-between">
                    <Flag jurisdiction={j} size={36} className="rounded-[5px]" />
                    <span className="text-xs text-[var(--muted)]">
                      {count} {count === 1 ? "listing" : "listings"}
                    </span>
                  </div>
                  <div className="mt-3 font-semibold">{j}</div>
                  <div className="text-xs text-[var(--muted)]">{kit.regulator}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-2)]">
                    <Timer className="h-3.5 w-3.5" /> CoC ~{kit.typicalWeeks} weeks
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* TWO-SIDED VALUE */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface overflow-hidden">
            <div className="relative h-48">
              <Image src={IMAGES.dealClosed} alt="Acquirer and seller closing a deal" fill className="object-cover" sizes="(min-width: 768px) 560px, 100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              <span className="badge absolute bottom-3 left-4 bg-white/95">
                <Building2 className="h-3.5 w-3.5" /> Buy-side
              </span>
            </div>
            <div className="p-7 pt-6">
            <h3 className="font-display text-2xl font-bold">For acquirers</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                "Shortlist of 2–5 entities that fit your mandate — not 300 cards to scroll",
                "Banking, MLRO, passporting and CoC route visible before NDA",
                "Jurisdiction CoC kits: UBO chart, fit & proper, re-KYC, s.178 / BoL packs",
                "Verified-funds badge moves you to the front of the seller queue",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                  {t}
                </li>
              ))}
            </ul>
            <Link href={dashboardHref} className="btn btn-primary mt-6">
              Start a buy-side mandate <ArrowRight className="h-4 w-4" />
            </Link>
            </div>
          </div>
          <div className="hero-dark overflow-hidden rounded-[18px]">
            <div className="relative h-48">
              <Image src={IMAGES.advisory} alt="Licence holder in a confidential advisory meeting" fill className="object-cover opacity-80" sizes="(min-width: 768px) 560px, 100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1222] to-transparent" />
              <span className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                <EyeOff className="h-3.5 w-3.5" /> Sell-side · discreet
              </span>
            </div>
            <div className="p-7 pt-6">
            <h3 className="font-display text-2xl font-bold text-white">For licence holders</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80">
              {[
                "Discrete mode: identity and financials stay hidden until mutual NDA",
                "Inbound only from ID- and funds-verified buyers",
                "Interest heatmap shows which gaps (banking, scope, price) cost you deals",
                "Grant time-boxed exclusivity once a buyer completes the CoC kit",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {t}
                </li>
              ))}
            </ul>
            <Link href={session?.role === "SELLER" ? "/assets/new" : "/login?role=seller"} className="btn btn-on-dark mt-6">
              List an entity discreetly <ArrowRight className="h-4 w-4" />
            </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="hero-dark overflow-hidden">
        <Image src={IMAGES.london} alt="" fill className="object-cover opacity-30" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1222] via-[#0a1222]/85 to-[#0a1222]/40" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Clock className="h-4 w-4" /> Every month of applying is a month competitors are live.
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold text-white">See which entities fit your mandate today.</h2>
          </div>
          <a href="#shortlist" className="btn btn-primary">
            Get my shortlist <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
