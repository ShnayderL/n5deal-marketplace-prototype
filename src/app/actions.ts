"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearSessionCookie,
  createSessionToken,
  getSession,
  requireSession,
  setSessionCookie,
} from "@/lib/auth";
import { validateAssetDraft } from "@/lib/ai";
import { cocProgress, getCocKit } from "@/lib/coc";
import { nextStage } from "@/lib/deals";
import { store, verifyPassword } from "@/lib/store";
import type { AssetStatus, Role } from "@/lib/types";
import { joinCsv } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const user = store.getUserByEmail(parsed.data.email);
  if (!user) return { error: "Invalid credentials." };
  if (user.status === "SUSPENDED") {
    return { error: "This account has been suspended by the platform manager." };
  }
  if (!verifyPassword(parsed.data.password, user.passwordHash)) {
    return { error: "Invalid credentials." };
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    company: user.company,
  });
  await setSessionCookie(token);
  redirect(dashboardPath(user.role));
}

export async function demoLoginAction(email: string) {
  const user = store.getUserByEmail(email);
  if (!user || user.status === "SUSPENDED") {
    return { error: "Demo account unavailable." };
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    company: user.company,
  });
  await setSessionCookie(token);
  redirect(dashboardPath(user.role));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

function dashboardPath(role: Role) {
  if (role === "MANAGER") return "/manager";
  if (role === "SELLER") return "/seller";
  return "/buyer";
}

const buyerProfileSchema = z.object({
  headline: z.string().min(10),
  interests: z.string().min(20),
  preferredCategories: z.string().min(2),
  preferredJurisdictions: z.string().min(2),
  budgetMin: z.coerce.number().int().min(0),
  budgetMax: z.coerce.number().int().min(0),
  ticketNote: z.string().optional(),
  company: z.string().optional(),
  requiresBanking: z.enum(["true", "false"]).optional(),
  requiresPassporting: z.enum(["true", "false"]).optional(),
  timelineWeeks: z.coerce.number().int().positive().optional(),
  servicesNeeded: z.string().optional(),
});

export async function updateBuyerProfileAction(formData: FormData) {
  const session = await requireSession(["BUYER"]);
  const parsed = buyerProfileSchema.safeParse({
    headline: formData.get("headline"),
    interests: formData.get("interests"),
    preferredCategories: formData.get("preferredCategories"),
    preferredJurisdictions: formData.get("preferredJurisdictions"),
    budgetMin: formData.get("budgetMin"),
    budgetMax: formData.get("budgetMax"),
    ticketNote: formData.get("ticketNote") || undefined,
    company: formData.get("company") || undefined,
    requiresBanking: formData.get("requiresBanking") === "on" ? "true" : "false",
    requiresPassporting: formData.get("requiresPassporting") === "on" ? "true" : "false",
    timelineWeeks: formData.get("timelineWeeks") || undefined,
    servicesNeeded: formData.get("servicesNeeded") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please complete all required profile fields." };
  }
  if (parsed.data.budgetMax < parsed.data.budgetMin) {
    return { error: "Budget max must be greater than or equal to budget min." };
  }

  store.updateUser(session.id, { company: parsed.data.company || session.company });
  const existing = store.getUserById(session.id)?.buyerProfile;
  store.upsertBuyerProfile(session.id, {
    headline: parsed.data.headline,
    interests: parsed.data.interests,
    preferredCategories: parsed.data.preferredCategories,
    preferredJurisdictions: parsed.data.preferredJurisdictions,
    budgetMin: parsed.data.budgetMin,
    budgetMax: parsed.data.budgetMax,
    ticketNote: parsed.data.ticketNote || null,
    requiresBanking: parsed.data.requiresBanking === "true",
    requiresPassporting: parsed.data.requiresPassporting === "true",
    timelineWeeks: parsed.data.timelineWeeks ?? null,
    servicesNeeded: parsed.data.servicesNeeded || "",
    identityVerified: existing?.identityVerified ?? false,
    fundsVerified: existing?.fundsVerified ?? false,
    verifiedFundsAmount: existing?.verifiedFundsAmount ?? null,
  });

  revalidatePath("/buyer");
  revalidatePath("/profile");
  return { success: true };
}

const sellerProfileSchema = z.object({
  companyName: z.string().min(2),
  bio: z.string().min(20),
  website: z.string().url().optional().or(z.literal("")),
});

export async function updateSellerProfileAction(formData: FormData) {
  const session = await requireSession(["SELLER"]);
  const parsed = sellerProfileSchema.safeParse({
    companyName: formData.get("companyName"),
    bio: formData.get("bio"),
    website: formData.get("website") || "",
  });

  if (!parsed.success) {
    return { error: "Please complete company name and bio (20+ chars)." };
  }

  store.updateUser(session.id, { company: parsed.data.companyName });
  store.upsertSellerProfile(session.id, {
    companyName: parsed.data.companyName,
    bio: parsed.data.bio,
    website: parsed.data.website || null,
  });

  revalidatePath("/seller");
  revalidatePath("/profile");
  return { success: true };
}

const assetSchema = z.object({
  title: z.string().min(8),
  summary: z.string().min(20),
  description: z.string().min(40),
  category: z.string().min(2),
  jurisdiction: z.string().min(2),
  licenseType: z.string().min(2),
  askingPrice: z.coerce.number().int().positive(),
  annualRevenue: z.coerce.number().int().optional(),
  employees: z.coerce.number().int().optional(),
  dealReadiness: z.enum(["EXPLORING", "READY", "URGENT"]),
  tags: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  bankingStatus: z.enum(["NONE", "IN_PROGRESS", "ACTIVE"]),
  entityType: z.enum(["SHELL", "OPERATIONAL", "APPLICATION"]),
  regulator: z.string().optional(),
  changeOfControlNotes: z.string().optional(),
  servicesInScope: z.string().optional(),
  hasComplianceOfficer: z.boolean(),
  hasLocalDirector: z.boolean(),
  hasPassporting: z.boolean(),
  discreteMode: z.boolean(),
});

export async function createAssetAction(formData: FormData) {
  const session = await requireSession(["SELLER"]);

  const raw = {
    title: String(formData.get("title") || ""),
    summary: String(formData.get("summary") || ""),
    description: String(formData.get("description") || ""),
    category: String(formData.get("category") || ""),
    jurisdiction: String(formData.get("jurisdiction") || ""),
    licenseType: String(formData.get("licenseType") || ""),
    askingPrice: formData.get("askingPrice"),
    annualRevenue: formData.get("annualRevenue") || undefined,
    employees: formData.get("employees") || undefined,
    dealReadiness: formData.get("dealReadiness") || "READY",
    tags: String(formData.get("tags") || ""),
    status: formData.get("status") || "PUBLISHED",
    bankingStatus: String(formData.get("bankingStatus") || "NONE"),
    entityType: String(formData.get("entityType") || "SHELL"),
    regulator: String(formData.get("regulator") || "") || undefined,
    changeOfControlNotes: String(formData.get("changeOfControlNotes") || "") || undefined,
    servicesInScope: String(formData.get("servicesInScope") || "") || undefined,
    hasComplianceOfficer: formData.get("hasComplianceOfficer") === "on",
    hasLocalDirector: formData.get("hasLocalDirector") === "on",
    hasPassporting: formData.get("hasPassporting") === "on",
    discreteMode: formData.get("discreteMode") === "on",
  };

  const validation = validateAssetDraft({
    title: raw.title,
    summary: raw.summary,
    description: raw.description,
    category: raw.category,
    jurisdiction: raw.jurisdiction,
    askingPrice: Number(raw.askingPrice) || 0,
    licenseType: raw.licenseType,
    bankingStatus: raw.bankingStatus as "NONE" | "IN_PROGRESS" | "ACTIVE",
    entityType: raw.entityType as "SHELL" | "OPERATIONAL" | "APPLICATION",
    regulator: raw.regulator,
    changeOfControlNotes: raw.changeOfControlNotes,
    servicesInScope: raw.servicesInScope,
    hasComplianceOfficer: raw.hasComplianceOfficer,
  });

  if (!validation.ok) {
    return { error: validation.errors.join(" "), warnings: validation.warnings };
  }

  const parsed = assetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid asset data. Check required fields.", warnings: validation.warnings };
  }

  const asset = store.createAsset({
    sellerId: session.id,
    title: parsed.data.title,
    summary: parsed.data.summary,
    description: parsed.data.description,
    category: parsed.data.category,
    jurisdiction: parsed.data.jurisdiction,
    licenseType: parsed.data.licenseType,
    askingPrice: parsed.data.askingPrice,
    annualRevenue: parsed.data.annualRevenue ?? null,
    employees: parsed.data.employees ?? null,
    dealReadiness: parsed.data.dealReadiness,
    tags: parsed.data.tags || parsed.data.category.toLowerCase(),
    status: parsed.data.status,
    bankingStatus: parsed.data.bankingStatus,
    entityType: parsed.data.entityType,
    regulator: parsed.data.regulator || null,
    changeOfControlNotes: parsed.data.changeOfControlNotes || null,
    servicesInScope: parsed.data.servicesInScope || "",
    hasComplianceOfficer: parsed.data.hasComplianceOfficer,
    hasLocalDirector: parsed.data.hasLocalDirector,
    hasPassporting: parsed.data.hasPassporting,
    discreteMode: parsed.data.discreteMode,
    exclusivityBuyerId: null,
    exclusivityUntil: null,
  });

  revalidatePath("/assets");
  revalidatePath("/seller");
  redirect(`/assets/${asset.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Please sign in to contact participants." };

  const toUserId = String(formData.get("toUserId") || "");
  const assetId = String(formData.get("assetId") || "") || null;
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!toUserId || subject.length < 4 || body.length < 10) {
    return { error: "Subject and a short message are required." };
  }
  if (toUserId === session.id) return { error: "You cannot message yourself." };

  const recipient = store.getUserById(toUserId);
  if (!recipient || recipient.status === "SUSPENDED") {
    return { error: "Recipient is not available." };
  }

  if (session.role === "BUYER" && recipient.role !== "SELLER") {
    return { error: "Buyers can contact sellers." };
  }
  if (session.role === "SELLER" && recipient.role !== "BUYER") {
    return { error: "Sellers can contact buyers." };
  }
  if (session.role === "MANAGER") {
    return { error: "Managers moderate the platform; use participant tools instead." };
  }

  store.createMessage({
    fromUserId: session.id,
    toUserId,
    assetId,
    subject,
    body,
  });

  revalidatePath("/messages");
  return { success: true };
}

export async function markMessageReadAction(messageId: string) {
  const session = await requireSession();
  store.markMessageRead(messageId, session.id);
  revalidatePath("/messages");
}

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "SUSPENDED") {
  const session = await requireSession(["MANAGER"]);
  if (userId === session.id) {
    return { error: "You cannot suspend your own manager account." };
  }

  const user = store.getUserById(userId);
  if (!user || user.role === "MANAGER") {
    return { error: "Cannot change status for this user." };
  }

  store.updateUser(userId, { status });
  revalidatePath("/manager");
  return { success: true };
}

export async function setAssetStatusAction(
  assetId: string,
  status: AssetStatus,
) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const asset = store.getAsset(assetId);
  if (!asset) return { error: "Asset not found" };

  if (session.role === "MANAGER" || (session.role === "SELLER" && asset.sellerId === session.id)) {
    store.updateAsset(assetId, { status });
  } else {
    return { error: "Forbidden" };
  }

  revalidatePath("/assets");
  revalidatePath("/manager");
  revalidatePath("/seller");
  revalidatePath(`/assets/${assetId}`);
  return { success: true };
}

export async function removeParticipantAction(userId: string) {
  await requireSession(["MANAGER"]);
  const user = store.getUserById(userId);
  if (!user || user.role === "MANAGER") {
    return { error: "Cannot remove this user." };
  }

  store.deleteUser(userId);
  revalidatePath("/manager");
  return { success: true };
}

export async function saveBuyerInterestsQuick(categories: string[], jurisdictions: string[]) {
  const session = await requireSession(["BUYER"]);
  const user = store.getUserById(session.id);
  if (!user?.buyerProfile) return;
  store.upsertBuyerProfile(session.id, {
    ...user.buyerProfile,
    preferredCategories: joinCsv(categories),
    preferredJurisdictions: joinCsv(jurisdictions),
  });
  revalidatePath("/buyer");
  revalidatePath("/profile");
}

export async function verifyBuyerIdentityAction() {
  const session = await requireSession(["BUYER"]);
  const user = store.getUserById(session.id);
  if (!user?.buyerProfile) return { error: "Complete your mandate profile first." };
  store.upsertBuyerProfile(session.id, {
    ...user.buyerProfile,
    identityVerified: true,
    verified: true,
  });
  revalidatePath("/profile");
  revalidatePath("/buyer");
  revalidatePath("/assets");
  return { success: true };
}

export async function verifyBuyerFundsAction(formData: FormData) {
  const session = await requireSession(["BUYER"]);
  const user = store.getUserById(session.id);
  if (!user?.buyerProfile) return { error: "Complete your mandate profile first." };
  if (!user.buyerProfile.identityVerified) {
    return { error: "Verify identity before verifying funds." };
  }
  const amount = Number(formData.get("verifiedFundsAmount") || 0);
  if (!amount || amount < 100000) {
    return { error: "Verified funds should be at least €100,000." };
  }
  store.upsertBuyerProfile(session.id, {
    ...user.buyerProfile,
    fundsVerified: true,
    verifiedFundsAmount: amount,
  });
  revalidatePath("/profile");
  revalidatePath("/buyer");
  revalidatePath("/assets");
  return { success: true };
}

export async function openDealInterestAction(assetId: string) {
  const session = await requireSession(["BUYER"]);
  const asset = store.getAsset(assetId);
  if (!asset || asset.status !== "PUBLISHED") return { error: "Asset unavailable." };
  store.openDealRoom({ assetId, buyerId: session.id, sellerId: asset.sellerId });
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/buyer");
  revalidatePath("/seller");
  return { success: true };
}

export async function signNdaAction(assetId: string) {
  const session = await requireSession(["BUYER"]);
  const asset = store.getAsset(assetId);
  if (!asset) return { error: "Asset not found." };
  const buyer = store.getUserById(session.id);
  if (!buyer?.buyerProfile?.identityVerified) {
    return { error: "Verify your identity in Profile before signing an NDA." };
  }
  let room = store.getDealRoom(assetId, session.id);
  if (!room) {
    room = store.openDealRoom({ assetId, buyerId: session.id, sellerId: asset.sellerId });
  }
  store.updateDealRoom(room.id, {
    stage: "NDA_SIGNED",
    ndaSignedAt: new Date().toISOString(),
  });
  store.createMessage({
    fromUserId: session.id,
    toUserId: asset.sellerId,
    assetId,
    subject: `NDA signed — ${asset.title}`,
    body: `${session.name} signed the mutual NDA and requested data-room access. Trust: ${buyer.buyerProfile.fundsVerified ? "funds verified" : "funds pending"}.`,
  });
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/messages");
  revalidatePath("/seller");
  return { success: true };
}

export async function advanceDealStageAction(assetId: string) {
  const session = await requireSession(["BUYER"]);
  const asset = store.getAsset(assetId);
  if (!asset) return { error: "Asset not found." };

  const room = store.getDealRoom(assetId, session.id);
  if (!room) return { error: "Open interest first." };
  const next = nextStage(room.stage);
  if (!next) return { error: "Already at LOI stage." };
  if (next === "NDA_SIGNED") return { error: "Use Sign NDA action." };
  if (next === "LOI_SENT") {
    const progress = cocProgress(getCocKit(asset.jurisdiction), room.checklistDone);
    if (!progress.readyForLoi) {
      return { error: "Complete all critical CoC checklist items before LOI." };
    }
  }
  store.updateDealRoom(room.id, { stage: next });
  if (next === "LOI_SENT") {
    store.createMessage({
      fromUserId: session.id,
      toUserId: asset.sellerId,
      assetId,
      subject: `LOI intent — ${asset.title}`,
      body: `${session.name} marked LOI stage after completing critical CoC checklist items.`,
    });
  }
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/buyer");
  revalidatePath("/messages");
  return { success: true };
}

export async function toggleCocChecklistAction(assetId: string, itemKey: string) {
  const session = await requireSession(["BUYER"]);
  const asset = store.getAsset(assetId);
  if (!asset) return { error: "Asset not found." };
  const room = store.getDealRoom(assetId, session.id);
  if (!room || !room.ndaSignedAt) return { error: "Sign NDA to unlock the CoC kit." };

  const done = new Set(room.checklistDone);
  if (done.has(itemKey)) done.delete(itemKey);
  else done.add(itemKey);
  const checklistDone = [...done];

  let stage = room.stage;
  if (stage === "NDA_SIGNED" || stage === "DATA_ROOM") {
    stage = "COC_IN_PROGRESS";
  }

  store.updateDealRoom(room.id, { checklistDone, stage });
  revalidatePath(`/assets/${assetId}`);
  return { success: true };
}

export async function setAssetDiscreteModeAction(assetId: string, discreteMode: boolean) {
  const session = await requireSession(["SELLER"]);
  const asset = store.getAsset(assetId);
  if (!asset || asset.sellerId !== session.id) return { error: "Forbidden" };
  store.updateAsset(assetId, { discreteMode });
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/seller");
  return { success: true };
}

export async function grantExclusivityAction(assetId: string, buyerId: string, days = 14) {
  const session = await requireSession(["SELLER"]);
  const asset = store.getAsset(assetId);
  if (!asset || asset.sellerId !== session.id) return { error: "Forbidden" };
  const until = new Date(Date.now() + days * 86400000).toISOString();
  store.updateAsset(assetId, { exclusivityBuyerId: buyerId, exclusivityUntil: until });
  store.createMessage({
    fromUserId: session.id,
    toUserId: buyerId,
    assetId,
    subject: `Exclusivity granted — ${asset.title}`,
    body: `You have exclusive negotiation rights until ${until.slice(0, 10)}.`,
  });
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/seller");
  revalidatePath("/messages");
  return { success: true };
}
