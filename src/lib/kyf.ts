/**
 * KYF (Know-Your-Fintech) + Acquisition Mandate engine.
 * Domain scoring inspired by Cadena / Dealable24 / Financial License Market signals:
 * banking continuity, compliance roles, passporting, CoC feasibility, entity type.
 */
import { splitCsv } from "./utils";
import type { Asset, BankingStatus, BuyerProfile, DealReadiness, EntityType } from "./types";

export type KyfFactor = {
  key: string;
  label: string;
  score: number; // 0–100 contribution weight normalized later
  max: number;
  detail: string;
  status: "strong" | "ok" | "weak" | "missing";
};

export type KyfReport = {
  score: number;
  grade: "A" | "B" | "C" | "D";
  label: string;
  factors: KyfFactor[];
  blockers: string[];
  strengths: string[];
};

export type MandateMatch = {
  score: number;
  reasons: string[];
  gaps: string[];
  fitLabel: string;
};

const HIGH_TRUST_JURISDICTIONS = new Set([
  "Lithuania",
  "Estonia",
  "Cyprus",
  "Malta",
  "UK",
  "Germany",
  "Netherlands",
  "Ireland",
  "Singapore",
]);

function gradeFromScore(score: number): KyfReport["grade"] {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 45) return "C";
  return "D";
}

function labelFromGrade(grade: KyfReport["grade"]) {
  switch (grade) {
    case "A":
      return "Deal-ready";
    case "B":
      return "Conditionally ready";
    case "C":
      return "Elevated diligence";
    default:
      return "High friction";
  }
}

export function computeKyfReport(asset: Pick<
  Asset,
  | "licenseType"
  | "jurisdiction"
  | "bankingStatus"
  | "hasComplianceOfficer"
  | "hasLocalDirector"
  | "hasPassporting"
  | "entityType"
  | "changeOfControlNotes"
  | "servicesInScope"
  | "regulator"
  | "dealReadiness"
  | "summary"
  | "description"
>): KyfReport {
  const factors: KyfFactor[] = [];
  const blockers: string[] = [];
  const strengths: string[] = [];

  // License clarity (20)
  if (asset.licenseType && asset.licenseType.length > 2) {
    factors.push({
      key: "license",
      label: "License clarity",
      score: 20,
      max: 20,
      detail: `License typed as ${asset.licenseType}`,
      status: "strong",
    });
    strengths.push(`Clear license class: ${asset.licenseType}`);
  } else {
    factors.push({
      key: "license",
      label: "License clarity",
      score: 4,
      max: 20,
      detail: "License type missing — buyers cannot map CoC path",
      status: "missing",
    });
    blockers.push("Missing license type (EMI / PI / VASP / …)");
  }

  // Regulator (10)
  if (asset.regulator) {
    factors.push({
      key: "regulator",
      label: "Regulator named",
      score: 10,
      max: 10,
      detail: asset.regulator,
      status: "strong",
    });
    strengths.push(`Regulator: ${asset.regulator}`);
  } else {
    factors.push({
      key: "regulator",
      label: "Regulator named",
      score: 2,
      max: 10,
      detail: "No supervisor named — standing check harder",
      status: "weak",
    });
  }

  // Banking continuity (25) — competitors' #1 signal
  const bankingScore =
    asset.bankingStatus === "ACTIVE" ? 25 : asset.bankingStatus === "IN_PROGRESS" ? 12 : 2;
  factors.push({
    key: "banking",
    label: "Banking continuity",
    score: bankingScore,
    max: 25,
    detail:
      asset.bankingStatus === "ACTIVE"
        ? "Active banking relationships signaled"
        : asset.bankingStatus === "IN_PROGRESS"
          ? "Banking in progress — confirm before exclusivity"
          : "No banking — major day-1 risk for EMI/PI buyers",
    status: asset.bankingStatus === "ACTIVE" ? "strong" : asset.bankingStatus === "IN_PROGRESS" ? "ok" : "missing",
  });
  if (asset.bankingStatus === "ACTIVE") strengths.push("Banking ready / active accounts");
  if (asset.bankingStatus === "NONE") blockers.push("No banking continuity signal");

  // Compliance roles (15)
  let compliancePts = 0;
  if (asset.hasComplianceOfficer) compliancePts += 9;
  if (asset.hasLocalDirector) compliancePts += 6;
  factors.push({
    key: "compliance",
    label: "Compliance / local substance",
    score: compliancePts,
    max: 15,
    detail: [
      asset.hasComplianceOfficer ? "MLRO/CO present" : "No compliance officer flagged",
      asset.hasLocalDirector ? "Local director present" : "No local director flagged",
    ].join(" · "),
    status: compliancePts >= 12 ? "strong" : compliancePts >= 6 ? "ok" : "weak",
  });
  if (!asset.hasComplianceOfficer) blockers.push("Compliance officer / MLRO not confirmed");
  if (asset.hasComplianceOfficer && asset.hasLocalDirector) {
    strengths.push("Compliance officer + local director");
  }

  // Passporting (10)
  factors.push({
    key: "passporting",
    label: "EEA/UK passporting",
    score: asset.hasPassporting ? 10 : 3,
    max: 10,
    detail: asset.hasPassporting ? "Passporting / cross-border rights indicated" : "Domestic-only or unclear",
    status: asset.hasPassporting ? "strong" : "ok",
  });
  if (asset.hasPassporting) strengths.push("Passporting indicated");

  // Entity type (10)
  const entityPts =
    asset.entityType === "OPERATIONAL" ? 10 : asset.entityType === "APPLICATION" ? 5 : 6;
  factors.push({
    key: "entity",
    label: "Entity posture",
    score: entityPts,
    max: 10,
    detail:
      asset.entityType === "OPERATIONAL"
        ? "Operational entity (revenue / clients possible)"
        : asset.entityType === "SHELL"
          ? "Shell / ready-made vehicle"
          : "License application vehicle",
    status: asset.entityType === "OPERATIONAL" ? "strong" : "ok",
  });

  // CoC notes (5) + jurisdiction trust (5)
  const cocPts = asset.changeOfControlNotes && asset.changeOfControlNotes.length > 20 ? 5 : 1;
  factors.push({
    key: "coc",
    label: "Change-of-control notes",
    score: cocPts,
    max: 5,
    detail: asset.changeOfControlNotes || "No CoC guidance — buyers will ask before NDA",
    status: cocPts === 5 ? "strong" : "weak",
  });
  if (cocPts < 5) blockers.push("Add change-of-control / filing notes");

  const jurisPts = HIGH_TRUST_JURISDICTIONS.has(asset.jurisdiction) ? 5 : 3;
  factors.push({
    key: "jurisdiction",
    label: "Jurisdiction familiarity",
    score: jurisPts,
    max: 5,
    detail: asset.jurisdiction,
    status: jurisPts === 5 ? "strong" : "ok",
  });

  // Deal readiness seller signal (bonus inside completeness — folded into description quality)
  const descLen = (asset.description || "").length + (asset.summary || "").length;
  const completenessPts = Math.min(5, Math.floor(descLen / 80));
  factors.push({
    key: "completeness",
    label: "Asset ID completeness",
    score: completenessPts,
    max: 5,
    detail: descLen > 200 ? "Teaser + description sufficient for shortlist" : "Thin narrative — expect more questions",
    status: completenessPts >= 4 ? "strong" : "ok",
  });

  if (asset.dealReadiness === "URGENT") {
    strengths.push("Seller marked deal as urgent");
  }

  const raw = factors.reduce((s, f) => s + f.score, 0);
  const max = factors.reduce((s, f) => s + f.max, 0);
  const score = Math.round((raw / max) * 100);
  const grade = gradeFromScore(score);

  return {
    score,
    grade,
    label: labelFromGrade(grade),
    factors,
    blockers: blockers.slice(0, 5),
    strengths: strengths.slice(0, 5),
  };
}

export type MandateInput = {
  preferredCategories: string;
  preferredJurisdictions: string;
  budgetMin: number;
  budgetMax: number;
  interests: string;
  requiresBanking?: boolean;
  requiresPassporting?: boolean;
  servicesNeeded?: string;
  timelineWeeks?: number | null;
};

export function scoreMandateFit(
  asset: Asset,
  mandate: MandateInput,
): MandateMatch {
  const reasons: string[] = [];
  const gaps: string[] = [];
  let score = 0;

  const cats = splitCsv(mandate.preferredCategories);
  const juris = splitCsv(mandate.preferredJurisdictions);
  const servicesNeeded = splitCsv(mandate.servicesNeeded || "");

  // Category / license family (30)
  const catHit =
    cats.some((c) => c.toLowerCase() === asset.category.toLowerCase()) ||
    (asset.licenseType &&
      cats.some((c) => asset.licenseType!.toLowerCase().includes(c.toLowerCase())));
  if (catHit) {
    score += 30;
    reasons.push(`License/category fit: ${asset.category}${asset.licenseType ? ` · ${asset.licenseType}` : ""}`);
  } else {
    gaps.push("Category/license outside preferred mandate");
  }

  // Jurisdiction (20)
  if (juris.some((j) => j.toLowerCase() === asset.jurisdiction.toLowerCase())) {
    score += 20;
    reasons.push(`Jurisdiction match: ${asset.jurisdiction}`);
  } else {
    gaps.push(`Jurisdiction ${asset.jurisdiction} not in mandate`);
  }

  // Budget (15)
  if (asset.askingPrice >= mandate.budgetMin && asset.askingPrice <= mandate.budgetMax) {
    score += 15;
    reasons.push("Within acquisition budget");
  } else if (asset.askingPrice <= mandate.budgetMax * 1.15) {
    score += 7;
    reasons.push("Slightly above budget ceiling");
    gaps.push("Negotiate or stretch budget");
  } else {
    gaps.push("Asking price outside budget envelope");
  }

  // Banking requirement (15)
  if (mandate.requiresBanking) {
    if (asset.bankingStatus === "ACTIVE") {
      score += 15;
      reasons.push("Banking continuity meets mandate");
    } else if (asset.bankingStatus === "IN_PROGRESS") {
      score += 6;
      gaps.push("Banking not fully active — confirm before exclusivity");
    } else {
      gaps.push("Mandate requires banking; asset has none");
    }
  } else if (asset.bankingStatus === "ACTIVE") {
    score += 5;
    reasons.push("Bonus: banking already active");
  }

  // Passporting (10)
  if (mandate.requiresPassporting) {
    if (asset.hasPassporting) {
      score += 10;
      reasons.push("Passporting aligns with mandate");
    } else {
      gaps.push("Mandate needs passporting; not indicated");
    }
  } else if (asset.hasPassporting) {
    score += 4;
    reasons.push("Passporting available");
  }

  // Services overlap (5)
  if (servicesNeeded.length && asset.servicesInScope) {
    const scope = asset.servicesInScope.toLowerCase();
    const hits = servicesNeeded.filter((s) => scope.includes(s.toLowerCase()));
    if (hits.length) {
      score += Math.min(5, hits.length * 2);
      reasons.push(`Services overlap: ${hits.slice(0, 3).join(", ")}`);
    }
  }

  // Interest keywords (5)
  const interestWords = (mandate.interests || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);
  const hay = `${asset.title} ${asset.summary} ${asset.tags} ${asset.licenseType || ""} ${asset.servicesInScope}`.toLowerCase();
  const kw = interestWords.filter((w) => hay.includes(w)).slice(0, 3);
  if (kw.length) {
    score += Math.min(5, kw.length * 2);
    reasons.push(`Interest keywords: ${kw.join(", ")}`);
  }

  // Timeline pressure vs seller readiness
  if (mandate.timelineWeeks != null && mandate.timelineWeeks <= 12) {
    if (asset.dealReadiness === "READY" || asset.dealReadiness === "URGENT") {
      score += 3;
      reasons.push("Seller readiness supports short timeline");
    } else {
      gaps.push("Tight timeline vs exploring seller");
    }
  }

  const finalScore = Math.min(100, Math.round(score));
  const fitLabel =
    finalScore >= 75 ? "Strong mandate fit" : finalScore >= 55 ? "Partial fit" : finalScore >= 35 ? "Weak fit" : "Poor fit";

  return { score: finalScore, reasons, gaps: gaps.slice(0, 4), fitLabel };
}

export function mandateFromBuyerProfile(profile: BuyerProfile): MandateInput {
  return {
    preferredCategories: profile.preferredCategories,
    preferredJurisdictions: profile.preferredJurisdictions,
    budgetMin: profile.budgetMin,
    budgetMax: profile.budgetMax,
    interests: profile.interests,
    requiresBanking: profile.requiresBanking,
    requiresPassporting: profile.requiresPassporting,
    servicesNeeded: profile.servicesNeeded,
    timelineWeeks: profile.timelineWeeks,
  };
}

export function validateAssetId(input: {
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
  const warnings: string[] = [];
  const errors: string[] = [];

  if (input.title.trim().length < 8) errors.push("Title should be at least 8 characters.");
  if (input.summary.trim().length < 40) {
    warnings.push("Teaser under 40 chars — buyers shortlist slower without a crisp summary.");
  }
  if (input.description.trim().length < 120) {
    warnings.push("Add license status, banking, and deal structure — peers like Cadena lead with diligence signals.");
  }
  if (!input.category) errors.push("Category is required.");
  if (!input.jurisdiction) errors.push("Jurisdiction is required.");
  if (!input.askingPrice || input.askingPrice < 10000) {
    errors.push("Asking price should be at least €10,000.");
  }
  if (!input.licenseType || input.licenseType.trim().length < 2) {
    errors.push("License type is required (EMI, PI, VASP, CASP, MSB…).");
  }
  if (!input.bankingStatus) {
    errors.push("Banking status is required — critical for regulated buyers.");
  }
  if (!input.entityType) {
    errors.push("Entity type (Operational / Shell / Application) is required.");
  }
  if (!input.regulator || input.regulator.trim().length < 2) {
    warnings.push("Name the supervisor (Bank of Lithuania, FCA, CySEC…) — improves KYF trust.");
  }
  if (!input.changeOfControlNotes || input.changeOfControlNotes.trim().length < 20) {
    warnings.push("Add change-of-control / filing notes — top buyers ask before NDA.");
  }
  if (!input.servicesInScope || input.servicesInScope.trim().length < 3) {
    warnings.push("List services in scope (e-money, remittance, custody…) for mandate matching.");
  }
  if (input.bankingStatus === "NONE" && ["EMI", "Payments", "Neobank"].includes(input.category)) {
    warnings.push("EMI/Payments without banking is a common deal-breaker — flag remediation path.");
  }
  if (!input.hasComplianceOfficer && input.entityType === "OPERATIONAL") {
    warnings.push("Operational entity without MLRO/CO will face buyer pushback.");
  }
  if (input.askingPrice > 0 && input.askingPrice < 100000) {
    warnings.push("Low ask — confirm shelf/application vehicle pricing is intentional.");
  }

  return { errors, warnings, ok: errors.length === 0 };
}

export function normalizeBankingStatus(value: unknown): BankingStatus {
  if (value === "ACTIVE" || value === "IN_PROGRESS" || value === "NONE") return value;
  return "NONE";
}

export function normalizeEntityType(value: unknown): EntityType {
  if (value === "OPERATIONAL" || value === "SHELL" || value === "APPLICATION") return value;
  return "SHELL";
}

export function normalizeDealReadiness(value: unknown): DealReadiness {
  if (value === "EXPLORING" || value === "READY" || value === "URGENT") return value;
  return "READY";
}
