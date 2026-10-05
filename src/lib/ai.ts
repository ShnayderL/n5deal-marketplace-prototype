import { splitCsv } from "./utils";

export type MatchableAsset = {
  id: string;
  title: string;
  summary: string;
  category: string;
  jurisdiction: string;
  askingPrice: number;
  tags: string;
  licenseType: string | null;
};

export type MatchableBuyer = {
  id: string;
  name: string;
  company: string | null;
  buyerProfile: {
    headline: string;
    interests: string;
    preferredCategories: string;
    preferredJurisdictions: string;
    budgetMin: number;
    budgetMax: number;
  } | null;
};

export type MatchResult<T> = T & {
  score: number;
  reasons: string[];
};

function overlapScore(a: string[], b: string[]) {
  const setB = new Set(b.map((x) => x.toLowerCase()));
  const hits = a.filter((x) => setB.has(x.toLowerCase()));
  if (!a.length || !b.length) return { score: 0, hits };
  return { score: hits.length / Math.max(a.length, 1), hits };
}

export function scoreAssetForBuyer(
  asset: MatchableAsset,
  buyer: MatchableBuyer,
): MatchResult<MatchableAsset> {
  const profile = buyer.buyerProfile;
  if (!profile) {
    return { ...asset, score: 0, reasons: ["Buyer profile incomplete"] };
  }

  const reasons: string[] = [];
  let score = 0;

  const cats = splitCsv(profile.preferredCategories);
  const juris = splitCsv(profile.preferredJurisdictions);

  if (cats.some((c) => c.toLowerCase() === asset.category.toLowerCase())) {
    score += 40;
    reasons.push(`Category match: ${asset.category}`);
  }

  if (
    juris.some((j) => j.toLowerCase() === asset.jurisdiction.toLowerCase())
  ) {
    score += 25;
    reasons.push(`Jurisdiction match: ${asset.jurisdiction}`);
  }

  if (
    asset.askingPrice >= profile.budgetMin &&
    asset.askingPrice <= profile.budgetMax
  ) {
    score += 25;
    reasons.push("Within stated budget");
  } else if (asset.askingPrice <= profile.budgetMax * 1.15) {
    score += 10;
    reasons.push("Near budget ceiling");
  }

  const interestWords = profile.interests
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  const haystack = `${asset.title} ${asset.summary} ${asset.tags} ${asset.licenseType ?? ""}`.toLowerCase();
  const keywordHits = interestWords.filter((w) => haystack.includes(w)).slice(0, 4);
  if (keywordHits.length) {
    score += Math.min(15, keywordHits.length * 4);
    reasons.push(`Interest keywords: ${keywordHits.join(", ")}`);
  }

  return { ...asset, score: Math.min(100, Math.round(score)), reasons };
}

export function scoreBuyerForAsset(
  buyer: MatchableBuyer,
  asset: MatchableAsset,
): MatchResult<MatchableBuyer> {
  const profile = buyer.buyerProfile;
  if (!profile) {
    return { ...buyer, score: 0, reasons: ["Incomplete buyer profile"] };
  }

  const mirrored = scoreAssetForBuyer(asset, buyer);
  return {
    ...buyer,
    score: mirrored.score,
    reasons: mirrored.reasons,
  };
}

export type ParsedSmartQuery = {
  text: string;
  categories: string[];
  jurisdictions: string[];
  maxPrice?: number;
  minPrice?: number;
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

  return { text, categories, jurisdictions, maxPrice, minPrice };
}

function parseAmount(raw: string, unit?: string) {
  const n = Number(raw.replace(/,/g, ""));
  if (Number.isNaN(n)) return undefined;
  if (!unit) return n;
  if (unit.startsWith("m")) return Math.round(n * 1_000_000);
  if (unit.startsWith("k") || unit.startsWith("thousand")) return Math.round(n * 1_000);
  return n;
}

export function validateAssetDraft(input: {
  title: string;
  summary: string;
  description: string;
  category: string;
  jurisdiction: string;
  askingPrice: number;
}) {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (input.title.trim().length < 8) {
    errors.push("Title should be at least 8 characters.");
  }
  if (input.summary.trim().length < 40) {
    warnings.push("A longer summary helps buyers shortlist faster (40+ chars recommended).");
  }
  if (input.description.trim().length < 120) {
    warnings.push("Add more operational detail — buyers expect license, traction, and deal structure.");
  }
  if (!input.category) errors.push("Category is required.");
  if (!input.jurisdiction) errors.push("Jurisdiction is required.");
  if (!input.askingPrice || input.askingPrice < 10000) {
    errors.push("Asking price should be at least €10,000 for marketplace listings.");
  }
  if (input.askingPrice > 0 && input.askingPrice < 100000) {
    warnings.push("Low asking price — confirm this is intentional for a shelf/license vehicle.");
  }

  return { errors, warnings, ok: errors.length === 0 };
}
