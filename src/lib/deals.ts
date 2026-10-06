import { computeKyfReport, scoreMandateFit, mandateFromBuyerProfile } from "./kyf";
import type { Asset, BuyerProfile, DealRoom, DealStage } from "./types";

export const DEAL_STAGES: { id: DealStage; label: string; order: number }[] = [
  { id: "INTERESTED", label: "Interest", order: 0 },
  { id: "NDA_SIGNED", label: "NDA", order: 1 },
  { id: "DATA_ROOM", label: "Data room", order: 2 },
  { id: "COC_IN_PROGRESS", label: "CoC kit", order: 3 },
  { id: "LOI_SENT", label: "LOI", order: 4 },
];

export function stageOrder(stage: DealStage) {
  return DEAL_STAGES.find((s) => s.id === stage)?.order ?? 0;
}

export function canAdvanceTo(from: DealStage, to: DealStage) {
  return stageOrder(to) === stageOrder(from) + 1 || stageOrder(to) <= stageOrder(from);
}

export function nextStage(stage: DealStage): DealStage | null {
  const order = stageOrder(stage);
  return DEAL_STAGES.find((s) => s.order === order + 1)?.id ?? null;
}

export function hasNdaAccess(room: DealRoom | null | undefined) {
  if (!room) return false;
  return stageOrder(room.stage) >= stageOrder("NDA_SIGNED") && Boolean(room.ndaSignedAt);
}

export function isSeriousBuyer(profile: BuyerProfile | null | undefined) {
  if (!profile) return false;
  return profile.identityVerified && profile.fundsVerified;
}

export function buyerTrustLabel(profile: BuyerProfile | null | undefined) {
  if (!profile) return "No mandate";
  if (profile.identityVerified && profile.fundsVerified) return "Serious buyer";
  if (profile.identityVerified) return "ID verified";
  if (profile.fundsVerified) return "Funds verified";
  return "Unverified";
}

export type InterestHeatSignal = {
  key: string;
  label: string;
  count: number;
};

/** Aggregate repeated mandate gaps across interested buyers for a seller listing. */
export function buildInterestHeatmap(
  asset: Asset,
  buyers: { profile: BuyerProfile; room: DealRoom }[],
): InterestHeatSignal[] {
  const counts = new Map<string, number>();

  for (const { profile } of buyers) {
    const fit = scoreMandateFit(asset, mandateFromBuyerProfile(profile));
    for (const gap of fit.gaps) {
      const key = gap.toLowerCase().includes("banking")
        ? "banking"
        : gap.toLowerCase().includes("passport")
          ? "passporting"
          : gap.toLowerCase().includes("budget") || gap.toLowerCase().includes("price")
            ? "budget"
            : gap.toLowerCase().includes("jurisdiction")
              ? "jurisdiction"
              : gap.toLowerCase().includes("category") || gap.toLowerCase().includes("license")
                ? "license"
                : "other";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  const labels: Record<string, string> = {
    banking: "Banking continuity gaps",
    passporting: "Passporting gaps",
    budget: "Budget / price gaps",
    jurisdiction: "Jurisdiction mismatches",
    license: "License / category mismatches",
    other: "Other diligence gaps",
  };

  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: labels[key] || key, count }))
    .sort((a, b) => b.count - a.count);
}

export function listingFloorOk(asset: Asset) {
  return computeKyfReport(asset).score >= 45;
}

export function anonymizeAssetTitle(title: string) {
  return title.replace(/\b(Lithuanian|Estonian|UK|UAE|Spanish|German|Maltese|Cyprus|Singapore)\b/gi, "Confidential");
}
