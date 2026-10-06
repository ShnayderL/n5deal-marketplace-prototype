import { describe, expect, it } from "vitest";
import { buildShortlist, DEFAULT_SHORTLIST_INPUT, displayTitle } from "@/lib/shortlist";
import type { Asset } from "@/lib/types";

function asset(overrides: Partial<Asset>): Asset {
  return {
    id: "a",
    sellerId: "s",
    title: "Lithuanian EMI",
    summary: "Operational EMI with SEPA access",
    description: "Full description of the entity for testing purposes.",
    category: "EMI",
    jurisdiction: "Lithuania",
    licenseType: "EMI",
    askingPrice: 2_000_000,
    currency: "EUR",
    annualRevenue: null,
    employees: null,
    dealReadiness: "READY",
    status: "PUBLISHED",
    tags: "emi",
    bankingStatus: "ACTIVE",
    hasComplianceOfficer: true,
    hasLocalDirector: true,
    hasPassporting: true,
    entityType: "OPERATIONAL",
    changeOfControlNotes: "BoL change of control filing prepared",
    servicesInScope: "e-money, payments",
    regulator: "Bank of Lithuania",
    discreteMode: false,
    exclusivityBuyerId: null,
    exclusivityUntil: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("buildShortlist", () => {
  it("ranks the mandate-fitting EMI above off-mandate entities", () => {
    const fit = asset({ id: "fit" });
    const offMandate = asset({
      id: "off",
      category: "Crypto",
      licenseType: "VASP",
      jurisdiction: "Singapore",
      askingPrice: 9_000_000,
      bankingStatus: "NONE",
      hasPassporting: false,
    });
    const result = buildShortlist([offMandate, fit], DEFAULT_SHORTLIST_INPUT);
    expect(result.scanned).toBe(2);
    expect(result.items[0]?.id).toBe("fit");
    expect(result.items.every((i) => i.id !== "off")).toBe(true);
    expect(result.filteredOut).toBeGreaterThanOrEqual(1);
  });

  it("never returns more than three entities", () => {
    const many = Array.from({ length: 6 }, (_, i) => asset({ id: `a${i}` }));
    expect(buildShortlist(many, DEFAULT_SHORTLIST_INPUT).items).toHaveLength(3);
  });

  it("masks discrete listings", () => {
    expect(displayTitle(asset({ discreteMode: true }))).toBe("Confidential EMI · Lithuania");
  });
});
