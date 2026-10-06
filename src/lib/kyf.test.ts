import { describe, expect, it } from "vitest";
import { computeKyfReport, scoreMandateFit } from "@/lib/kyf";
import type { Asset } from "@/lib/types";

const strongAsset: Asset = {
  id: "a1",
  sellerId: "s1",
  title: "Lithuanian EMI with EU Passporting",
  summary: "Operational EMI with SEPA and merchants.",
  description:
    "Regulated EMI with full compliance stack, passporting, and active banking relationships across the EEA market.",
  category: "EMI",
  jurisdiction: "Lithuania",
  licenseType: "EMI",
  askingPrice: 2_800_000,
  currency: "EUR",
  annualRevenue: 1_900_000,
  employees: 28,
  dealReadiness: "READY",
  status: "PUBLISHED",
  tags: "emi,sepa",
  bankingStatus: "ACTIVE",
  hasComplianceOfficer: true,
  hasLocalDirector: true,
  hasPassporting: true,
  entityType: "OPERATIONAL",
  changeOfControlNotes:
    "Bank of Lithuania CoC notification typically 30–60 days; share deal preferred with clean standing letter.",
  servicesInScope: "e-money,SEPA,merchant acquiring",
  regulator: "Bank of Lithuania",
  createdAt: "",
  updatedAt: "",
};

describe("computeKyfReport", () => {
  it("grades a deal-ready EMI as A/B", () => {
    const report = computeKyfReport(strongAsset);
    expect(report.score).toBeGreaterThanOrEqual(75);
    expect(["A", "B"]).toContain(report.grade);
    expect(report.strengths.length).toBeGreaterThan(0);
  });

  it("penalizes missing banking and compliance", () => {
    const weak = computeKyfReport({
      ...strongAsset,
      bankingStatus: "NONE",
      hasComplianceOfficer: false,
      hasLocalDirector: false,
      changeOfControlNotes: null,
      regulator: null,
    });
    expect(weak.score).toBeLessThan(reportScore(strongAsset));
    expect(weak.blockers.length).toBeGreaterThan(0);
  });
});

function reportScore(asset: Asset) {
  return computeKyfReport(asset).score;
}

describe("scoreMandateFit", () => {
  it("rewards banking when mandate requires it", () => {
    const withBanking = scoreMandateFit(strongAsset, {
      preferredCategories: "EMI",
      preferredJurisdictions: "Lithuania",
      budgetMin: 500_000,
      budgetMax: 5_000_000,
      interests: "regulated EMI",
      requiresBanking: true,
      requiresPassporting: true,
      servicesNeeded: "e-money,SEPA",
      timelineWeeks: 12,
    });
    const without = scoreMandateFit(
      { ...strongAsset, bankingStatus: "NONE", hasPassporting: false },
      {
        preferredCategories: "EMI",
        preferredJurisdictions: "Lithuania",
        budgetMin: 500_000,
        budgetMax: 5_000_000,
        interests: "regulated EMI",
        requiresBanking: true,
        requiresPassporting: true,
        servicesNeeded: "e-money",
        timelineWeeks: 12,
      },
    );
    expect(withBanking.score).toBeGreaterThan(without.score);
    expect(without.gaps.length).toBeGreaterThan(0);
  });
});
