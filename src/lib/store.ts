import { randomUUID } from "crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { hashPassword, verifyPassword } from "./password";
import {
  normalizeBankingStatus,
  normalizeDealReadiness,
  normalizeEntityType,
} from "./kyf";
import type {
  Asset,
  AssetStatus,
  BuyerProfile,
  Database,
  DealRoom,
  DealStage,
  Message,
  SellerProfile,
  User,
  UserStatus,
} from "./types";
import { createSeedDatabase } from "./seed-data";

export { hashPassword, verifyPassword };

function normalizeDealStage(value: unknown): DealStage {
  const allowed: DealStage[] = [
    "INTERESTED",
    "NDA_SIGNED",
    "DATA_ROOM",
    "COC_IN_PROGRESS",
    "LOI_SENT",
  ];
  return allowed.includes(value as DealStage) ? (value as DealStage) : "INTERESTED";
}

function normalizeAsset(raw: Partial<Asset> & Pick<Asset, "id" | "sellerId" | "title">): Asset {
  return {
    id: raw.id,
    sellerId: raw.sellerId,
    title: raw.title,
    summary: raw.summary || "",
    description: raw.description || "",
    category: raw.category || "Fintech",
    jurisdiction: raw.jurisdiction || "EU",
    licenseType: raw.licenseType ?? null,
    askingPrice: raw.askingPrice || 0,
    currency: raw.currency || "EUR",
    annualRevenue: raw.annualRevenue ?? null,
    employees: raw.employees ?? null,
    dealReadiness: normalizeDealReadiness(raw.dealReadiness),
    status: (raw.status as AssetStatus) || "DRAFT",
    tags: raw.tags || "",
    bankingStatus: normalizeBankingStatus(raw.bankingStatus),
    hasComplianceOfficer: Boolean(raw.hasComplianceOfficer),
    hasLocalDirector: Boolean(raw.hasLocalDirector),
    hasPassporting: Boolean(raw.hasPassporting),
    entityType: normalizeEntityType(raw.entityType),
    changeOfControlNotes: raw.changeOfControlNotes ?? null,
    servicesInScope: raw.servicesInScope || "",
    regulator: raw.regulator ?? null,
    discreteMode: Boolean(raw.discreteMode),
    exclusivityBuyerId: raw.exclusivityBuyerId ?? null,
    exclusivityUntil: raw.exclusivityUntil ?? null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function normalizeBuyerProfile(
  raw: Partial<BuyerProfile> & Pick<BuyerProfile, "id" | "userId">,
): BuyerProfile {
  return {
    id: raw.id,
    userId: raw.userId,
    headline: raw.headline || "",
    interests: raw.interests || "",
    preferredCategories: raw.preferredCategories || "",
    preferredJurisdictions: raw.preferredJurisdictions || "",
    budgetMin: raw.budgetMin || 0,
    budgetMax: raw.budgetMax || 0,
    ticketNote: raw.ticketNote ?? null,
    verified: Boolean(raw.verified),
    requiresBanking: Boolean(raw.requiresBanking),
    requiresPassporting: Boolean(raw.requiresPassporting),
    timelineWeeks: raw.timelineWeeks ?? null,
    servicesNeeded: raw.servicesNeeded || "",
    identityVerified: Boolean(raw.identityVerified),
    fundsVerified: Boolean(raw.fundsVerified),
    verifiedFundsAmount: raw.verifiedFundsAmount ?? null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function normalizeDealRoom(raw: Partial<DealRoom> & Pick<DealRoom, "id" | "assetId" | "buyerId" | "sellerId">): DealRoom {
  return {
    id: raw.id,
    assetId: raw.assetId,
    buyerId: raw.buyerId,
    sellerId: raw.sellerId,
    stage: normalizeDealStage(raw.stage),
    ndaSignedAt: raw.ndaSignedAt ?? null,
    checklistDone: Array.isArray(raw.checklistDone) ? raw.checklistDone : [],
    notes: raw.notes ?? null,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

const globalStore = globalThis as unknown as {
  n5dealDb?: Database;
  n5dealDbPath?: string;
};

function resolveDbPath() {
  if (process.env.VERCEL) {
    const bundled = path.join(process.cwd(), "data", "store.json");
    const writable = "/tmp/n5deal-store.json";
    if (!existsSync(writable) && existsSync(bundled)) {
      copyFileSync(bundled, writable);
    }
    return writable;
  }
  return path.join(process.cwd(), "data", "store.json");
}

function loadDatabase(): Database {
  const dbPath = resolveDbPath();
  globalStore.n5dealDbPath = dbPath;

  if (existsSync(dbPath)) {
    const parsed = JSON.parse(readFileSync(dbPath, "utf8")) as Database;
    const migrated: Database = {
      ...parsed,
      assets: (parsed.assets || []).map((a) => normalizeAsset(a)),
      buyerProfiles: (parsed.buyerProfiles || []).map((p) => normalizeBuyerProfile(p)),
      dealRooms: (parsed.dealRooms || []).map((r) => normalizeDealRoom(r)),
    };
    return migrated;
  }

  const seeded = createSeedDatabase();
  persist(seeded);
  return seeded;
}

function persist(db: Database) {
  const dbPath = globalStore.n5dealDbPath || resolveDbPath();
  mkdirSync(path.dirname(dbPath), { recursive: true });
  try {
    writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch {
    // On fully read-only environments, keep in-memory state only.
  }
}

function db(): Database {
  if (!globalStore.n5dealDb) {
    globalStore.n5dealDb = loadDatabase();
  }
  return globalStore.n5dealDb;
}

function touch() {
  persist(db());
}

function now() {
  return new Date().toISOString();
}

export const store = {
  reset() {
    globalStore.n5dealDb = createSeedDatabase();
    touch();
  },

  listUsers(filter?: { role?: User["role"]; status?: UserStatus; q?: string }) {
    return db()
      .users.filter((user) => {
        if (filter?.role && user.role !== filter.role) return false;
        if (filter?.status && user.status !== filter.status) return false;
        if (filter?.q) {
          const q = filter.q.toLowerCase();
          const profile = db().buyerProfiles.find((p) => p.userId === user.id);
          const hay = `${user.name} ${user.email} ${user.company || ""} ${profile?.headline || ""} ${profile?.interests || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((user) => hydrateUser(user));
  },

  getUserById(id: string) {
    const user = db().users.find((u) => u.id === id);
    return user ? hydrateUser(user) : null;
  },

  getUserByEmail(email: string) {
    const user = db().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? hydrateUser(user) : null;
  },

  updateUser(id: string, data: Partial<Pick<User, "company" | "status" | "name">>) {
    const user = db().users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, data, { updatedAt: now() });
    touch();
    return hydrateUser(user);
  },

  deleteUser(id: string) {
    const data = db();
    data.users = data.users.filter((u) => u.id !== id);
    data.buyerProfiles = data.buyerProfiles.filter((p) => p.userId !== id);
    data.sellerProfiles = data.sellerProfiles.filter((p) => p.userId !== id);
    data.assets = data.assets.filter((a) => a.sellerId !== id);
    data.messages = data.messages.filter((m) => m.fromUserId !== id && m.toUserId !== id);
    data.dealRooms = (data.dealRooms || []).filter((r) => r.buyerId !== id && r.sellerId !== id);
    touch();
  },

  upsertBuyerProfile(
    userId: string,
    input: Omit<BuyerProfile, "id" | "userId" | "createdAt" | "updatedAt" | "verified"> & {
      verified?: boolean;
    },
  ) {
    const data = db();
    const existing = data.buyerProfiles.find((p) => p.userId === userId);
    if (existing) {
      Object.assign(existing, input, { updatedAt: now() });
    } else {
      data.buyerProfiles.push({
        id: randomUUID(),
        userId,
        verified: input.verified ?? false,
        createdAt: now(),
        updatedAt: now(),
        headline: input.headline,
        interests: input.interests,
        preferredCategories: input.preferredCategories,
        preferredJurisdictions: input.preferredJurisdictions,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        ticketNote: input.ticketNote ?? null,
        requiresBanking: input.requiresBanking ?? false,
        requiresPassporting: input.requiresPassporting ?? false,
        timelineWeeks: input.timelineWeeks ?? null,
        servicesNeeded: input.servicesNeeded ?? "",
        identityVerified: input.identityVerified ?? false,
        fundsVerified: input.fundsVerified ?? false,
        verifiedFundsAmount: input.verifiedFundsAmount ?? null,
      });
    }
    touch();
  },

  upsertSellerProfile(
    userId: string,
    input: Omit<SellerProfile, "id" | "userId" | "createdAt" | "updatedAt" | "verified"> & {
      verified?: boolean;
    },
  ) {
    const data = db();
    const existing = data.sellerProfiles.find((p) => p.userId === userId);
    if (existing) {
      Object.assign(existing, input, { updatedAt: now() });
    } else {
      data.sellerProfiles.push({
        id: randomUUID(),
        userId,
        verified: input.verified ?? false,
        createdAt: now(),
        updatedAt: now(),
        companyName: input.companyName,
        bio: input.bio,
        website: input.website ?? null,
      });
    }
    touch();
  },

  listAssets(filter?: {
    status?: AssetStatus | AssetStatus[];
    sellerId?: string;
    category?: string;
    jurisdiction?: string;
    q?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    return db()
      .assets.filter((asset) => {
        if (filter?.sellerId && asset.sellerId !== filter.sellerId) return false;
        if (filter?.status) {
          const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
          if (!statuses.includes(asset.status)) return false;
        }
        if (filter?.category && asset.category !== filter.category) return false;
        if (filter?.jurisdiction && asset.jurisdiction !== filter.jurisdiction) return false;
        if (filter?.minPrice != null && asset.askingPrice < filter.minPrice) return false;
        if (filter?.maxPrice != null && asset.askingPrice > filter.maxPrice) return false;
        if (filter?.q) {
          const q = filter.q.toLowerCase();
          const hay =
            `${asset.title} ${asset.summary} ${asset.tags} ${asset.licenseType || ""} ${asset.category} ${asset.jurisdiction} ${asset.servicesInScope} ${asset.regulator || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((asset) => hydrateAsset(asset));
  },

  getAsset(id: string) {
    const asset = db().assets.find((a) => a.id === id);
    return asset ? hydrateAsset(asset) : null;
  },

  createAsset(
    input: Omit<Asset, "id" | "createdAt" | "updatedAt" | "currency"> & { currency?: string },
  ) {
    const asset = normalizeAsset({
      id: randomUUID(),
      currency: input.currency || "EUR",
      createdAt: now(),
      updatedAt: now(),
      sellerId: input.sellerId,
      title: input.title,
      summary: input.summary,
      description: input.description,
      category: input.category,
      jurisdiction: input.jurisdiction,
      licenseType: input.licenseType,
      askingPrice: input.askingPrice,
      annualRevenue: input.annualRevenue,
      employees: input.employees,
      dealReadiness: input.dealReadiness,
      status: input.status,
      tags: input.tags,
      bankingStatus: input.bankingStatus,
      hasComplianceOfficer: input.hasComplianceOfficer,
      hasLocalDirector: input.hasLocalDirector,
      hasPassporting: input.hasPassporting,
      entityType: input.entityType,
      changeOfControlNotes: input.changeOfControlNotes,
      servicesInScope: input.servicesInScope,
      regulator: input.regulator,
      discreteMode: input.discreteMode,
      exclusivityBuyerId: input.exclusivityBuyerId,
      exclusivityUntil: input.exclusivityUntil,
    });
    db().assets.unshift(asset);
    touch();
    return hydrateAsset(asset);
  },

  updateAsset(
    id: string,
    data: Partial<
      Pick<
        Asset,
        | "status"
        | "title"
        | "summary"
        | "discreteMode"
        | "exclusivityBuyerId"
        | "exclusivityUntil"
      >
    >,
  ) {
    const asset = db().assets.find((a) => a.id === id);
    if (!asset) return null;
    Object.assign(asset, data, { updatedAt: now() });
    touch();
    return hydrateAsset(asset);
  },

  getDealRoom(assetId: string, buyerId: string) {
    return (
      (db().dealRooms || [])
        .map(normalizeDealRoom)
        .find((r) => r.assetId === assetId && r.buyerId === buyerId) || null
    );
  },

  listDealRoomsForAsset(assetId: string) {
    return (db().dealRooms || [])
      .filter((r) => r.assetId === assetId)
      .map(normalizeDealRoom)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  listDealRoomsForBuyer(buyerId: string) {
    return (db().dealRooms || [])
      .filter((r) => r.buyerId === buyerId)
      .map(normalizeDealRoom)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  listDealRoomsForSeller(sellerId: string) {
    return (db().dealRooms || [])
      .filter((r) => r.sellerId === sellerId)
      .map(normalizeDealRoom)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  openDealRoom(input: { assetId: string; buyerId: string; sellerId: string }) {
    const existing = this.getDealRoom(input.assetId, input.buyerId);
    if (existing) return existing;
    const room = normalizeDealRoom({
      id: randomUUID(),
      assetId: input.assetId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      stage: "INTERESTED",
      ndaSignedAt: null,
      checklistDone: [],
      notes: null,
      createdAt: now(),
      updatedAt: now(),
    });
    if (!db().dealRooms) db().dealRooms = [];
    db().dealRooms.unshift(room);
    touch();
    return room;
  },

  updateDealRoom(
    id: string,
    data: Partial<Pick<DealRoom, "stage" | "ndaSignedAt" | "checklistDone" | "notes">>,
  ) {
    const room = (db().dealRooms || []).find((r) => r.id === id);
    if (!room) return null;
    Object.assign(room, data, { updatedAt: now() });
    touch();
    return normalizeDealRoom(room);
  },

  countUsers(filter?: { role?: User["role"]; status?: UserStatus }) {
    return this.listUsers(filter).length;
  },

  countAssets(filter?: { status?: AssetStatus }) {
    return this.listAssets(filter).length;
  },

  listMessagesForUser(userId: string) {
    return db()
      .messages.filter((m) => m.fromUserId === userId || m.toUserId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((message) => hydrateMessage(message));
  },

  countUnread(userId: string) {
    return db().messages.filter((m) => m.toUserId === userId && !m.read).length;
  },

  createMessage(input: Omit<Message, "id" | "createdAt" | "read"> & { read?: boolean }) {
    const message: Message = {
      id: randomUUID(),
      createdAt: now(),
      read: input.read ?? false,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      assetId: input.assetId,
      subject: input.subject,
      body: input.body,
    };
    db().messages.unshift(message);
    touch();
    return hydrateMessage(message);
  },

  markMessageRead(messageId: string, userId: string) {
    const message = db().messages.find((m) => m.id === messageId && m.toUserId === userId);
    if (!message) return;
    message.read = true;
    touch();
  },
};

function hydrateUser(user: User) {
  return {
    ...user,
    buyerProfile: db().buyerProfiles.find((p) => p.userId === user.id) || null,
    sellerProfile: db().sellerProfiles.find((p) => p.userId === user.id) || null,
    assets: db().assets.filter((a) => a.sellerId === user.id),
  };
}

function hydrateAsset(asset: Asset) {
  const seller = db().users.find((u) => u.id === asset.sellerId)!;
  return {
    ...asset,
    seller: {
      id: seller.id,
      name: seller.name,
      company: seller.company,
      role: seller.role,
      status: seller.status,
      sellerProfile: db().sellerProfiles.find((p) => p.userId === seller.id) || null,
    },
  };
}

function hydrateMessage(message: Message) {
  const fromUser = db().users.find((u) => u.id === message.fromUserId)!;
  const toUser = db().users.find((u) => u.id === message.toUserId)!;
  const asset = message.assetId ? db().assets.find((a) => a.id === message.assetId) || null : null;
  return {
    ...message,
    fromUser: { name: fromUser.name, company: fromUser.company, role: fromUser.role },
    toUser: { name: toUser.name, company: toUser.company, role: toUser.role },
    asset: asset ? { id: asset.id, title: asset.title } : null,
  };
}

export type { AssetStatus, UserStatus };
