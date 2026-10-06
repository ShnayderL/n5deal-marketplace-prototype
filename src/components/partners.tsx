import Image from "next/image";

const PARTNERS = [
  { name: "Stripe", logo: "stripe", service: "Card acquiring", tint: "#635BFF" },
  { name: "Adyen", logo: "adyen", service: "Payment processing", tint: "#0ABF53" },
  { name: "Visa", logo: "visa", service: "Card scheme access", tint: "#1A1F71" },
  { name: "Mastercard", logo: "mastercard", service: "Card scheme access", tint: "#EB001B" },
  { name: "PayPal", logo: "paypal", service: "Wallets & payouts", tint: "#002991" },
  { name: "Wise", logo: "wise", service: "Multi-currency rails", tint: "#163300" },
  { name: "N26", logo: "n26", service: "Banking partner", tint: "#48AC98" },
  { name: "American Express", logo: "americanexpress", service: "Card acceptance", tint: "#2E77BC" },
] as const;

export function PartnersSection() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-soft)]">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="mb-7 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-2)]">Our partners</p>
            <h2 className="mt-2 font-display text-3xl font-bold">One deal team: legal, compliance, banking, escrow</h2>
          </div>
          <p className="max-w-sm text-sm text-[var(--muted)]">
            Vetted specialists plugged into every Deal Room — from the change-of-control filing to settlement.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PARTNERS.map((p) => (
            <div
              key={p.name}
              className="group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${p.tint}14` }}
              >
                <Image src={`/partners/${p.logo}.svg`} alt={`${p.name} logo`} width={26} height={26} />
              </span>
              <div className="min-w-0">
                <div className="truncate font-display text-[16px] font-bold tracking-tight" style={{ color: p.tint }}>
                  {p.name}
                </div>
                <div className="truncate text-xs text-[var(--muted)]">{p.service}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-[var(--muted)]">
          Logos shown for demo purposes only; trademarks belong to their respective owners.
        </p>
      </div>
    </section>
  );
}
