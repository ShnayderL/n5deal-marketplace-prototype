import {
  mandateFromBuyerProfile,
  scoreMandateFit,
  validateAssetId,
  type MandateInput,
} from "./kyf";
import type { Asset, BankingStatus, BuyerProfile, EntityType } from "./types";

export type MatchableAsset = Pick<
  Asset,
  | "id"
  | "title"
  | "summary"
  | "category"
  | "jurisdiction"
  | "askingPrice"
  | "tags"
  | "licenseType"
  | "bankingStatus"
  | "hasPassporting"
  | "hasComplianceOfficer"
  | "hasLocalDirector"
  | "entityType"
  | "servicesInScope"
  | "dealReadiness"
  | "changeOfControlNotes"
  | "regulator"
  | "description"
>;

export type MatchableBuyer = {
  id: string;
  name: string;
  company: string | null;
  buyerProfile: Pick<
    BuyerProfile,
    | "headline"
    | "interests"
    | "preferredCategories"
    | "preferredJurisdictions"
    | "budgetMin"
    | "budgetMax"
    | "requiresBanking"
    | "requiresPassporting"
    | "servicesNeeded"
    | "timelineWeeks"
  > | null;
};

export type MatchResult<T> = T & {
  score: number;
  reasons: string[];
  gaps?: string[];
  fitLabel?: string;
};

function toMandate(profile: NonNullable<MatchableBuyer["buyerProfile"]>): MandateInput {
  return {
    preferredCategories: profile.preferredCategories,
    preferredJurisdictions: profile.preferredJurisdictions,
    budgetMin: profile.budgetMin,
    budgetMax: profile.budgetMax,
    interests: profile.interests,
    requiresBanking: profile.requiresBanking ?? false,
    requiresPassporting: profile.requiresPassporting ?? false,
    servicesNeeded: profile.servicesNeeded ?? "",
    timelineWeeks: profile.timelineWeeks ?? null,
  };
}

function asAssetForMandate(asset: MatchableAsset): Asset {
  return {
    id: asset.id,
    sellerId: "",
    title: asset.title,
    summary: asset.summary,
    description: asset.description || "",
    category: asset.category,
    jurisdiction: asset.jurisdiction,
    licenseType: asset.licenseType,
    askingPrice: asset.askingPrice,
    currency: "EUR",
    annualRevenue: null,
    employees: null,
    dealReadiness: asset.dealReadiness || "READY",
    status: "PUBLISHED",
    tags: asset.tags,
    bankingStatus: asset.bankingStatus || "NONE",
    hasComplianceOfficer: asset.hasComplianceOfficer ?? false,
    hasLocalDirector: asset.hasLocalDirector ?? false,
    hasPassporting: asset.hasPassporting ?? false,
    entityType: asset.entityType || "SHELL",
    changeOfControlNotes: asset.changeOfControlNotes ?? null,
    servicesInScope: asset.servicesInScope || "",
    regulator: asset.regulator ?? null,
    createdAt: "",
    updatedAt: "",
  };
}

export function scoreAssetForBuyer(
  asset: MatchableAsset,
  buyer: MatchableBuyer,
): MatchResult<MatchableAsset> {
  const profile = buyer.buyerProfile;
  if (!profile) {
    return { ...asset, score: 0, reasons: ["Buyer profile incomplete"], gaps: [], fitLabel: "No mandate" };
  }

  const fit = scoreMandateFit(asAssetForMandate(asset), toMandate(profile));
  return {
    ...asset,
    score: fit.score,
    reasons: fit.reasons,
    gaps: fit.gaps,
    fitLabel: fit.fitLabel,
  };
}

export function scoreBuyerForAsset(
  buyer: MatchableBuyer,
  asset: MatchableAsset,
): MatchResult<MatchableBuyer> {
  const profile = buyer.buyerProfile;
  if (!profile) {
    return { ...buyer, score: 0, reasons: ["Incomplete buyer profile"], gaps: [], fitLabel: "No mandate" };
  }

  const mirrored = scoreAssetForBuyer(asset, buyer);
  return {
    ...buyer,
    score: mirrored.score,
    reasons: mirrored.reasons,
    gaps: mirrored.gaps,
    fitLabel: mirrored.fitLabel,
  };
}

export type ParsedSmartQuery = {
  text: string;
  categories: string[];
  jurisdictions: string[];
  maxPrice?: number;
  minPrice?: number;
  bankingRequired?: boolean;
  passportingRequired?: boolean;
};

const CATEGORY_ALIASES: Record<string, string> = {
  emi: "EMI",
  payments: "Payments",
  payment: "Payments",
  crypto: "Crypto",
  vasp: "VASP",
  blockchain: "Blockchain",
  neobank: "Neobank",
  lending: "Lending",
  bnpl: "BNPL",
  banking: "Banking",
  license: "License",
  licence: "License",
  shelf: "Shelf Company",
  fintech: "Fintech",
};

const JURISDICTION_ALIASES: Record<string, string> = {
  lithuania: "Lithuania",
  estonia: "Estonia",
  cyprus: "Cyprus",
  malta: "Malta",
  singapore: "Singapore",
  "hong kong": "Hong Kong",
  dubai: "Dubai",
  uae: "UAE",
  uk: "UK",
  "united kingdom": "UK",
  germany: "Germany",
  spain: "Spain",
  portugal: "Portugal",
  netherlands: "Netherlands",
  mauritius: "Mauritius",
  cayman: "Cayman",
};

export function parseSmartQuery(input: string): ParsedSmartQuery {
  const text = input.trim();
  const lower = text.toLowerCase();
  const categories: string[] = [];
  const jurisdictions: string[] = [];

  for (const [alias, value] of Object.entries(CATEGORY_ALIASES)) {
    if (lower.includes(alias) && !categories.includes(value)) {
      categories.push(value);
    }
  }

  for (const [alias, value] of Object.entries(JURISDICTION_ALIASES)) {
    if (lower.includes(alias) && !jurisdictions.includes(value)) {
      jurisdictions.push(value);
    }
  }

  let maxPrice: number | undefined;
  let minPrice: number | undefined;

  const under = lower.match(/(?:under|below|max|up to)\s*€?\s*([\d.,]+)\s*(m|million|k|thousand)?/);
  if (under) {
    maxPrice = parseAmount(under[1], under[2]);
  }

  const over = lower.match(/(?:over|above|min|from)\s*€?\s*([\d.,]+)\s*(m|million|k|thousand)?/);
  if (over) {
    minPrice = parseAmount(over[1], over[2]);
  }

  const between = lower.match(
    /(?:between|from)\s*€?\s*([\d.,]+)\s*(m|million|k|thousand)?\s*(?:and|to|-)\s*€?\s*([\d.,]+)\s*(m|million|k|thousand)?/,
  );
  if (between) {
    minPrice = parseAmount(between[1], between[2]);
    maxPrice = parseAmount(between[3], between[4]);
  }

  const bankingRequired =
    /\b(with banking|banking ready|active banking|bank account)\b/.test(lower) || undefined;
  const passportingRequired =
    /\b(passporting|eea passport|eu passport)\b/.test(lower) || undefined;

  return {
    text,
    categories,
    jurisdictions,
    maxPrice,
    minPrice,
    bankingRequired: bankingRequired || undefined,
    passportingRequired: passportingRequired || undefined,
  };
}

function parseAmount(raw: string, unit?: string) {
  const n = Number(raw.replace(/,/g, ""));
  if (Number.isNaN(n)) return undefined;
  if (!unit) return n;
  if (unit.startsWith("m")) return Math.round(n * 1_000_000);
  if (unit.startsWith("k") || unit.startsWith("thousand")) return Math.round(n * 1_000);
  return n;
}

/** Smart Asset ID — domain-aware publish gate (alias kept for callers). */
export function validateAssetDraft(input: {
  title: string;
  summary: string;
  description: string;
  category: string;
  jurisdiction: string;
  askingPrice: number;
  licenseType?: string | null;
  bankingStatus?: BankingStatus;
  entityType?: EntityType;
  regulator?: string | null;
  changeOfControlNotes?: string | null;
  servicesInScope?: string;
  hasComplianceOfficer?: boolean;
}) {
  return validateAssetId(input);
}

export { computeKyfReport, scoreMandateFit, mandateFromBuyerProfile, validateAssetId } from "./kyf";
