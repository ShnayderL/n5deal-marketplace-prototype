import { getCocKit } from "./coc";
import { CATEGORIES, JURISDICTIONS, jurisdictionCode } from "./constants";
import { computeKyfReport, scoreMandateFit } from "./kyf";
import type { Asset, BankingStatus } from "./types";

export const LICENCE_FAMILIES = [
  { id: "emi", label: "EMI / e-money", categories: ["EMI", "Neobank"] },
  { id: "pi", label: "Payment institution", categories: ["Payments"] },
  { id: "crypto", label: "CASP / VASP", categories: ["Crypto", "VASP", "Blockchain"] },
  { id: "lending", label: "Lending / BNPL", categories: ["Lending", "BNPL"] },
  { id: "shelf", label: "Ready-made entity", categories: ["Shelf Company", "License"] },
  { id: "any", label: "Any licence", categories: [...CATEGORIES] },
] as const;

export const REGIONS = [
  {
    id: "eea",
    label: "EU / EEA (passportable)",
    jurisdictions: ["Lithuania", "Estonia", "Cyprus", "Malta", "Germany", "Spain", "Portugal", "Netherlands"],
  },
  { id: "uk", label: "United Kingdom", jurisdictions: ["UK"] },
  { id: "mena", label: "UAE / MENA", jurisdictions: ["UAE", "Dubai"] },
  { id: "apac", label: "Singapore / APAC", jurisdictions: ["Singapore", "Hong Kong"] },
  { id: "any", label: "Any jurisdiction", jurisdictions: [...JURISDICTIONS] },
] as const;

export const BUDGETS = [
  { value: 500_000, label: "Up to €500k" },
  { value: 1_000_000, label: "Up to €1M" },
  { value: 3_000_000, label: "Up to €3M" },
  { value: 6_000_000, label: "Up to €6M" },
  { value: 50_000_000, label: "€6M+" },
] as const;

export type ShortlistInput = {
  family: string;
  region: string;
  budgetMax: number;
  requiresBanking: boolean;
  requiresPassporting: boolean;
  timelineWeeks: number | null;
};

export const DEFAULT_SHORTLIST_INPUT: ShortlistInput = {
  family: "emi",
  region: "eea",
  budgetMax: 3_000_000,
  requiresBanking: true,
  requiresPassporting: true,
  timelineWeeks: 16,
};

export type ShortlistItem = {
  id: string;
  title: string;
  jurisdiction: string;
  code: string;
  licenseType: string;
  askingPrice: number;
  currency: string;
  kyfScore: number;
  kyfGrade: "A" | "B" | "C" | "D";
  fit: number;
  rank: number;
  reasons: string[];
  gaps: string[];
  cocWeeks: string;
  regulator: string;
  discrete: boolean;
  bankingStatus: BankingStatus;
  hasPassporting: boolean;
};

export type ShortlistResult = {
  items: ShortlistItem[];
  scanned: number;
  filteredOut: number;
};

export function displayTitle(asset: Pick<Asset, "discreteMode" | "title" | "licenseType" | "category" | "jurisdiction">) {
  if (!asset.discreteMode) return asset.title;
  return `Confidential ${asset.licenseType || asset.category} · ${asset.jurisdiction}`;
}

export function buildShortlist(assets: Asset[], input: ShortlistInput): ShortlistResult {
  const family = LICENCE_FAMILIES.find((f) => f.id === input.family) || LICENCE_FAMILIES[0];
  const region = REGIONS.find((r) => r.id === input.region) || REGIONS[REGIONS.length - 1];

  const scored = assets.map((asset) => {
    const fit = scoreMandateFit(asset, {
      preferredCategories: family.categories.join(","),
      preferredJurisdictions: region.jurisdictions.join(","),
      budgetMin: 0,
      budgetMax: input.budgetMax,
      interests: "",
      requiresBanking: input.requiresBanking,
      requiresPassporting: input.requiresPassporting,
      servicesNeeded: "",
      timelineWeeks: input.timelineWeeks,
    });
    const kyf = computeKyfReport(asset);
    const kit = getCocKit(asset.jurisdiction);
    return {
      asset,
      fit,
      kyf,
      kit,
      rank: Math.round(fit.score * 0.65 + kyf.score * 0.35),
    };
  });

  const qualifying = scored.filter((s) => s.fit.score >= 55);
  const items = scored
    .filter((s) => s.fit.score >= 35)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 3)
    .map<ShortlistItem>(({ asset, fit, kyf, kit, rank }) => ({
      id: asset.id,
      title: displayTitle(asset),
      jurisdiction: asset.jurisdiction,
      code: jurisdictionCode(asset.jurisdiction),
      licenseType: asset.licenseType || asset.category,
      askingPrice: asset.askingPrice,
      currency: asset.currency,
      kyfScore: kyf.score,
      kyfGrade: kyf.grade,
      fit: fit.score,
      rank,
      reasons: fit.reasons.slice(0, 2),
      gaps: fit.gaps.slice(0, 2),
      cocWeeks: kit.typicalWeeks,
      regulator: asset.regulator || kit.regulator,
      discrete: asset.discreteMode,
      bankingStatus: asset.bankingStatus,
      hasPassporting: asset.hasPassporting,
    }));

  return {
    items,
    scanned: assets.length,
    filteredOut: assets.length - qualifying.length,
  };
}
