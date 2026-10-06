import { describe, expect, it } from "vitest";
import { parseSmartQuery, scoreAssetForBuyer, validateAssetDraft } from "@/lib/ai";

const baseAsset = {
  id: "1",
  title: "Lithuanian EMI",
  summary: "Regulated EMI with SEPA",
  description: "Full operational EMI description with license and banking detail for buyers.",
  category: "EMI",
  jurisdiction: "Lithuania",
  askingPrice: 2_000_000,
  tags: "emi,sepa",
  licenseType: "EMI",
  bankingStatus: "ACTIVE" as const,
  hasPassporting: true,
  hasComplianceOfficer: true,
  hasLocalDirector: true,
  entityType: "OPERATIONAL" as const,
  servicesInScope: "e-money,SEPA",
  dealReadiness: "READY" as const,
  changeOfControlNotes: "BoL CoC notification 30–60 days for share deals.",
  regulator: "Bank of Lithuania",
};

describe("parseSmartQuery", () => {
  it("extracts category, jurisdiction and price ceiling", () => {
    const parsed = parseSmartQuery("EMI in Lithuania under €3m");
    expect(parsed.categories).toContain("EMI");
    expect(parsed.jurisdictions).toContain("Lithuania");
    expect(parsed.maxPrice).toBe(3_000_000);
  });

  it("parses between ranges", () => {
    const parsed = parseSmartQuery("crypto between 1m and 5 million");
    expect(parsed.categories).toContain("Crypto");
    expect(parsed.minPrice).toBe(1_000_000);
    expect(parsed.maxPrice).toBe(5_000_000);
  });

  it("detects banking and passporting intent", () => {
    const parsed = parseSmartQuery("EMI with banking and passporting in Lithuania");
    expect(parsed.bankingRequired).toBe(true);
    expect(parsed.passportingRequired).toBe(true);
  });
});

describe("scoreAssetForBuyer", () => {
  it("scores strong mandate overlap highly", () => {
    const result = scoreAssetForBuyer(baseAsset, {
      id: "b1",
      name: "Buyer",
      company: "Fund",
      buyerProfile: {
        headline: "EMI buyer",
        interests: "Looking for regulated EMI payments assets",
        preferredCategories: "EMI,Payments",
        preferredJurisdictions: "Lithuania,Estonia",
        budgetMin: 500_000,
        budgetMax: 5_000_000,
        requiresBanking: true,
        requiresPassporting: true,
        servicesNeeded: "e-money,SEPA",
        timelineWeeks: 12,
      },
    });

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.reasons.some((r) => r.toLowerCase().includes("jurisdiction") || r.toLowerCase().includes("license") || r.toLowerCase().includes("category"))).toBe(true);
  });
});

describe("validateAssetDraft", () => {
  it("rejects incomplete drafts", () => {
    const result = validateAssetDraft({
      title: "Short",
      summary: "Too short",
      description: "Also too short",
      category: "",
      jurisdiction: "",
      askingPrice: 100,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("requires license type and banking for Smart Asset ID", () => {
    const result = validateAssetDraft({
      title: "Operational EMI in Lithuania",
      summary: "Fully licensed EMI with passporting and merchant base across the EU market.",
      description:
        "Detailed description covering license status, financials, deal structure, and transition support for the acquiring party over the next twelve months of integration.",
      category: "EMI",
      jurisdiction: "Lithuania",
      askingPrice: 2_500_000,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("license"))).toBe(true);
  });

  it("accepts a domain-complete listing", () => {
    const result = validateAssetDraft({
      title: "Operational EMI in Lithuania",
      summary: "Fully licensed EMI with passporting and merchant base across the EU market.",
      description:
        "Detailed description covering license status, financials, deal structure, and transition support for the acquiring party over the next twelve months of integration.",
      category: "EMI",
      jurisdiction: "Lithuania",
      askingPrice: 2_500_000,
      licenseType: "EMI",
      bankingStatus: "ACTIVE",
      entityType: "OPERATIONAL",
      regulator: "Bank of Lithuania",
      changeOfControlNotes: "BoL change-of-control filing typically within 60 days of SPA.",
      servicesInScope: "e-money,SEPA",
      hasComplianceOfficer: true,
    });
    expect(result.ok).toBe(true);
  });
});
