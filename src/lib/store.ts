import { randomUUID } from "crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { hashPassword, verifyPassword } from "./password";
import type {
  Asset,
  AssetStatus,
  BuyerProfile,
  Database,
  Message,
  SellerProfile,
  User,
  UserStatus,
} from "./types";
import { createSeedDatabase } from "./seed-data";

export { hashPassword, verifyPassword };

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
    return parsed;
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
          const hay = `${asset.title} ${asset.summary} ${asset.tags} ${asset.licenseType || ""} ${asset.category} ${asset.jurisdiction}`.toLowerCase();
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
    const asset: Asset = {
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
    };
    db().assets.unshift(asset);
    touch();
    return hydrateAsset(asset);
  },

  updateAsset(id: string, data: Partial<Pick<Asset, "status" | "title" | "summary">>) {
    const asset = db().assets.find((a) => a.id === id);
    if (!asset) return null;
    Object.assign(asset, data, { updatedAt: now() });
    touch();
    return hydrateAsset(asset);
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
