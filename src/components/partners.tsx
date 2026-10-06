import type { ReactNode } from "react";

type Partner = {
  name: string;
  service: string;
  color: string;
  serif?: boolean;
  mark: (color: string) => ReactNode;
};

const PARTNERS: Partner[] = [
  {
    name: "LexBaltic",
    service: "Legal & CoC filings",
    color: "#0f766e",
    mark: (c) => (
      <>
        <rect x="3" y="3" width="14" height="14" rx="3" fill={c} />
        <rect x="11" y="11" width="14" height="14" rx="3" fill={c} opacity="0.45" />
      </>
    ),
  },
  {
    name: "Northgate",
    service: "MLRO & AML outsourcing",
    color: "#1d4ed8",
    mark: (c) => (
      <>
        <path d="M14 2 L26 24 H2 Z" fill={c} />
        <path d="M14 11 L19.5 21 H8.5 Z" fill="#fff" />
      </>
    ),
  },
  {
    name: "Meridian Audit",
    service: "Financial due diligence",
    color: "#7c3aed",
    mark: (c) => (
      <>
        <circle cx="14" cy="14" r="11" fill="none" stroke={c} strokeWidth="3.5" />
        <path d="M14 3 V25" stroke={c} strokeWidth="3.5" />
      </>
    ),
  },
  {
    name: "Railwise",
    service: "Banking & SEPA rails",
    color: "#0891b2",
    mark: (c) => (
      <>
        <rect x="3" y="5" width="22" height="4" rx="2" fill={c} />
        <rect x="3" y="12" width="16" height="4" rx="2" fill={c} opacity="0.7" />
        <rect x="3" y="19" width="10" height="4" rx="2" fill={c} opacity="0.45" />
      </>
    ),
  },
  {
    name: "Veriform",
    service: "KYC / KYB verification",
    color: "#16a34a",
    mark: (c) => (
      <>
        <path d="M14 2 L25 8 V20 L14 26 L3 20 V8 Z" fill={c} />
        <path d="M9 14.5 L12.5 18 L19 10.5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    name: "Corvus Capital",
    service: "Acquisition finance",
    color: "#b45309",
    mark: (c) => (
      <>
        <path d="M14 2 L26 14 L14 26 L2 14 Z" fill={c} />
        <path d="M14 8 L20 14 L14 20 L8 14 Z" fill="#fff" opacity="0.85" />
      </>
    ),
  },
  {
    name: "Ostra Escrow",
    service: "Escrow & settlement",
    color: "#be123c",
    mark: (c) => (
      <>
        <rect x="4" y="11" width="20" height="14" rx="3.5" fill={c} />
        <path d="M9 11 V8 a5 5 0 0 1 10 0 V11" stroke={c} strokeWidth="3" fill="none" />
        <circle cx="14" cy="18" r="2.2" fill="#fff" />
      </>
    ),
  },
  {
    name: "Halden & Co.",
    service: "UK & EU corporate law",
    color: "#334155",
    serif: true,
    mark: (c) => (
      <>
        <rect x="2" y="2" width="24" height="24" rx="5" fill={c} />
        <text x="14" y="19.5" textAnchor="middle" fontSize="15" fontFamily="Georgia, serif" fontWeight="700" fill="#fff">
          H
        </text>
      </>
    ),
  },
];

export function PartnerLogo({ partner }: { partner: Partner }) {
  return (
    <div className="group flex h-full flex-col justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-2.5 grayscale transition duration-300 group-hover:grayscale-0">
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
          {partner.mark(partner.color)}
        </svg>
        <span
          className={partner.serif ? "text-[17px] font-bold" : "font-display text-[17px] font-bold tracking-tight"}
          style={{ color: partner.color, fontFamily: partner.serif ? "Georgia, serif" : undefined }}
        >
          {partner.name}
        </span>
      </div>
      <span className="mt-3 text-xs text-[var(--muted)]">{partner.service}</span>
    </div>
  );
}

export function PartnersSection() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
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
            <PartnerLogo key={p.name} partner={p} />
          ))}
        </div>
        <p className="mt-4 text-[11px] text-[var(--muted)]">Partner brands shown are illustrative for this demo.</p>
      </div>
    </section>
  );
}
