/**
 * Jurisdiction Change-of-Control kits — what buyers must prepare before LOI.
 * Synthesized from public EMI/PI CoC guidance (Fintech Passport, FCA FG24/5 patterns).
 */
export type CocItem = {
  key: string;
  label: string;
  detail: string;
  owner: "buyer" | "seller" | "both";
  critical: boolean;
};

export type CocKit = {
  jurisdiction: string;
  regulator: string;
  typicalWeeks: string;
  summary: string;
  items: CocItem[];
};

const BASE_ITEMS: CocItem[] = [
  {
    key: "ubo-chart",
    label: "UBO / ownership chain chart",
    detail: "Full chain to natural persons with % holdings and source of funds narrative.",
    owner: "buyer",
    critical: true,
  },
  {
    key: "fit-proper",
    label: "Fit & proper packs for controllers",
    detail: "CVs, criminality certificates (<6 months), integrity questionnaires.",
    owner: "buyer",
    critical: true,
  },
  {
    key: "business-plan",
    label: "3–5 year business plan",
    detail: "Programme of operations post-acquisition, capital plan, governance.",
    owner: "buyer",
    critical: true,
  },
  {
    key: "sof",
    label: "Source of acquisition funding",
    detail: "Bank statements / fund docs proving purchase consideration liquidity.",
    owner: "buyer",
    critical: true,
  },
  {
    key: "standing-letter",
    label: "Regulatory standing confirmation",
    detail: "Seller provides good-standing / no open enforcement letter if available.",
    owner: "seller",
    critical: true,
  },
  {
    key: "aml-file",
    label: "AML / MLRO handover pack",
    detail: "Policies, SAR history summary, monitoring stack, MLRO continuity plan.",
    owner: "seller",
    critical: true,
  },
  {
    key: "banking-rekyc",
    label: "Banking re-KYC engagement",
    detail: "Open parallel conversation with EMI banks / PSPs on new UBO file.",
    owner: "both",
    critical: true,
  },
  {
    key: "safeguarding",
    label: "Safeguarding attestation review",
    detail: "EMI/PI: reconciliation history, acknowledgement letters, method.",
    owner: "seller",
    critical: false,
  },
  {
    key: "passport-register",
    label: "Passport / agent register check",
    detail: "Confirm host-state notifications match intended operating model.",
    owner: "both",
    critical: false,
  },
];

const KITS: Record<string, Partial<CocKit> & { extras?: CocItem[] }> = {
  Lithuania: {
    regulator: "Bank of Lithuania",
    typicalWeeks: "4–10",
    summary:
      "Qualifying holding notification under PSD2/EMD2. BoL assesses acquirer suitability before control is exercised.",
    extras: [
      {
        key: "bol-pack",
        label: "BoL qualifying holding pack",
        detail: "Use Bank of Lithuania notification forms for EMI/PI controllers.",
        owner: "buyer",
        critical: true,
      },
    ],
  },
  Estonia: {
    regulator: "EFSA / FIU (context-dependent)",
    typicalWeeks: "6–12",
    summary: "Control change for payment / VASP entities requires supervisor notification and fit assessment.",
  },
  UK: {
    regulator: "FCA",
    typicalWeeks: "8–16",
    summary:
      "s.178 Notice for controllers. FG24/5 expects detailed business plan and fresh criminality checks.",
    extras: [
      {
        key: "s178",
        label: "FCA s.178 controller notice",
        detail: "Prepare notice pack before SPA long-stop; no de-facto control pre-approval.",
        owner: "buyer",
        critical: true,
      },
      {
        key: "smcr",
        label: "SM&CR / senior manager plan",
        detail: "Map approved persons / SMF changes post-completion.",
        owner: "both",
        critical: true,
      },
    ],
  },
  Cyprus: {
    regulator: "CySEC / CBC (licence-dependent)",
    typicalWeeks: "8–14",
    summary: "Change in control filings for CIF / EMI-style entities; expect deep ownership scrutiny.",
  },
  Malta: {
    regulator: "MFSA / MGA (licence-dependent)",
    typicalWeeks: "8–16",
    summary: "Supervisor approval for qualifying holdings; gaming entities have parallel MGA gates.",
  },
  Germany: {
    regulator: "BaFin",
    typicalWeeks: "10–20",
    summary: "BaFin owner-control procedures are thorough; institutional buyers preferred for speed.",
  },
  Singapore: {
    regulator: "MAS",
    typicalWeeks: "8–16",
    summary: "Shareholding changes for licensed entities often need MAS approval / notification.",
  },
  UAE: {
    regulator: "DIFC / ADGM / CBUAE (zone-dependent)",
    typicalWeeks: "6–14",
    summary: "Registrar + regulator consent paths differ by free zone vs mainland.",
  },
};

export function getCocKit(jurisdiction: string): CocKit {
  const conf = KITS[jurisdiction];
  const extras = conf?.extras || [];
  return {
    jurisdiction,
    regulator: conf?.regulator || "Home supervisor",
    typicalWeeks: conf?.typicalWeeks || "6–16",
    summary:
      conf?.summary ||
      "Advance notification to the competent authority for qualifying holdings; do not exercise control before approval.",
    items: [...BASE_ITEMS, ...extras],
  };
}

export function cocProgress(kit: CocKit, doneKeys: string[]) {
  const critical = kit.items.filter((i) => i.critical);
  const done = new Set(doneKeys);
  const criticalDone = critical.filter((i) => done.has(i.key)).length;
  const totalDone = kit.items.filter((i) => done.has(i.key)).length;
  return {
    total: kit.items.length,
    done: totalDone,
    criticalTotal: critical.length,
    criticalDone,
    pct: Math.round((totalDone / kit.items.length) * 100),
    readyForLoi: criticalDone === critical.length,
  };
}
