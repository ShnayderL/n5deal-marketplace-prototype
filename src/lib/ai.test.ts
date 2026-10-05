import { describe, expect, it } from "vitest";
import { parseSmartQuery, scoreAssetForBuyer, validateAssetDraft } from "@/lib/ai";

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
});

describe("scoreAssetForBuyer", () => {
  it("scores strong category/jurisdiction/budget overlap highly", () => {
    const result = scoreAssetForBuyer(
      {
        id: "1",
        title: "Lithuanian EMI",
        summary: "Regulated EMI with SEPA",
        category: "EMI",
        jurisdiction: "Lithuania",
        askingPrice: 2_000_000,
        tags: "emi,sepa",
        licenseType: "EMI",
      },
      {
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
        },
      },
    );

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.reasons.some((r) => r.includes("Category"))).toBe(true);
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

  it("accepts a solid listing with warnings only", () => {
    const result = validateAssetDraft({
      title: "Operational EMI in Lithuania",
      summary: "Fully licensed EMI with passporting and merchant base across the EU market.",
      description:
        "Detailed description covering license status, financials, deal structure, and transition support for the acquiring party over the next twelve months of integration.",
      category: "EMI",
      jurisdiction: "Lithuania",
      askingPrice: 2_500_000,
    });
    expect(result.ok).toBe(true);
  });
});
