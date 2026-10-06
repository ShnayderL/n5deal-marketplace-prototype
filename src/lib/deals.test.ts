import { describe, expect, it } from "vitest";
import { cocProgress, getCocKit } from "@/lib/coc";
import { buildInterestHeatmap, hasNdaAccess, nextStage } from "@/lib/deals";
import type { Asset, BuyerProfile, DealRoom } from "@/lib/types";

describe("getCocKit", () => {
  it("returns Lithuania-specific BoL pack", () => {
    const kit = getCocKit("Lithuania");
    expect(kit.regulator).toContain("Lithuania");
    expect(kit.items.some((i) => i.key === "bol-pack")).toBe(true);
    expect(kit.items.some((i) => i.key === "banking-rekyc")).toBe(true);
  });

  it("tracks critical progress for LOI readiness", () => {
    const kit = getCocKit("UK");
    const criticalKeys = kit.items.filter((i) => i.critical).map((i) => i.key);
    const mid = cocProgress(kit, criticalKeys.slice(0, 2));
    expect(mid.readyForLoi).toBe(false);
    const full = cocProgress(kit, criticalKeys);
    expect(full.readyForLoi).toBe(true);
  });
});

describe("deal stages", () => {
  it("advances Interest → NDA → Data room", () => {
    expect(nextStage("INTERESTED")).toBe("NDA_SIGNED");
    expect(nextStage("NDA_SIGNED")).toBe("DATA_ROOM");
  });

  it("requires ndaSignedAt for NDA access", () => {
    const room: DealRoom = {
      id: "1",
      assetId: "a",
      buyerId: "b",
      sellerId: "s",
      stage: "NDA_SIGNED",
      ndaSignedAt: null,
      checklistDone: [],
      notes: null,
      createdAt: "",
      updatedAt: "",
    };
    expect(hasNdaAccess(room)).toBe(false);
    expect(hasNdaAccess({ ...room, ndaSignedAt: "2026-01-01" })).toBe(true);
  });
});

describe("interest heatmap", () => {
  it("aggregates banking gaps from mandates", () => {
    const asset = {
      id: "a1",
      sellerId: "s",
      title: "EMI",
      summary: "x",
      description: "y",
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
      bankingStatus: "NONE",
      hasComplianceOfficer: true,
      hasLocalDirector: true,
      hasPassporting: true,
      entityType: "OPERATIONAL",
      changeOfControlNotes: "notes long enough here",
      servicesInScope: "e-money",
      regulator: "BoL",
      discreteMode: false,
      exclusivityBuyerId: null,
      exclusivityUntil: null,
      createdAt: "",
      updatedAt: "",
    } as Asset;

    const profile = {
      id: "p",
      userId: "b",
      headline: "h",
      interests: "emi payments",
      preferredCategories: "EMI",
      preferredJurisdictions: "Lithuania",
      budgetMin: 500_000,
      budgetMax: 5_000_000,
      ticketNote: null,
      verified: true,
      requiresBanking: true,
      requiresPassporting: true,
      timelineWeeks: 12,
      servicesNeeded: "e-money",
      identityVerified: true,
      fundsVerified: true,
      verifiedFundsAmount: 3_000_000,
      createdAt: "",
      updatedAt: "",
    } as BuyerProfile;

    const room = {
      id: "r",
      assetId: "a1",
      buyerId: "b",
      sellerId: "s",
      stage: "INTERESTED",
      ndaSignedAt: null,
      checklistDone: [],
      notes: null,
      createdAt: "",
      updatedAt: "",
    } as DealRoom;

    const heat = buildInterestHeatmap(asset, [
      { profile, room },
      { profile, room },
    ]);
    expect(heat.some((h) => h.key === "banking" && h.count >= 2)).toBe(true);
  });
});
