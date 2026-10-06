export type Role = "BUYER" | "SELLER" | "MANAGER";
export type UserStatus = "ACTIVE" | "SUSPENDED";
export type AssetStatus = "DRAFT" | "PUBLISHED" | "SUSPENDED" | "SOLD";
export type DealReadiness = "EXPLORING" | "READY" | "URGENT";
export type BankingStatus = "NONE" | "IN_PROGRESS" | "ACTIVE";
export type EntityType = "SHELL" | "OPERATIONAL" | "APPLICATION";
export type DealStage =
  | "INTERESTED"
  | "NDA_SIGNED"
  | "DATA_ROOM"
  | "COC_IN_PROGRESS"
  | "LOI_SENT";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  status: UserStatus;
  company: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BuyerProfile = {
  id: string;
  userId: string;
  headline: string;
  interests: string;
  preferredCategories: string;
  preferredJurisdictions: string;
  budgetMin: number;
  budgetMax: number;
  ticketNote: string | null;
  verified: boolean;
  requiresBanking: boolean;
  requiresPassporting: boolean;
  timelineWeeks: number | null;
  servicesNeeded: string;
  /** Trust Gate — Acquire-style serious-buyer signals */
  identityVerified: boolean;
  fundsVerified: boolean;
  verifiedFundsAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerProfile = {
  id: string;
  userId: string;
  companyName: string;
  bio: string;
  website: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Asset = {
  id: string;
  sellerId: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  jurisdiction: string;
  licenseType: string | null;
  askingPrice: number;
  currency: string;
  annualRevenue: number | null;
  employees: number | null;
  dealReadiness: DealReadiness;
  status: AssetStatus;
  tags: string;
  bankingStatus: BankingStatus;
  hasComplianceOfficer: boolean;
  hasLocalDirector: boolean;
  hasPassporting: boolean;
  entityType: EntityType;
  changeOfControlNotes: string | null;
  servicesInScope: string;
  regulator: string | null;
  /** Hide seller identity & full description until NDA */
  discreteMode: boolean;
  exclusivityBuyerId: string | null;
  exclusivityUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  assetId: string | null;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
};

/** Buyer↔asset deal workflow (NDA → data room → CoC → LOI) */
export type DealRoom = {
  id: string;
  assetId: string;
  buyerId: string;
  sellerId: string;
  stage: DealStage;
  ndaSignedAt: string | null;
  checklistDone: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  users: User[];
  buyerProfiles: BuyerProfile[];
  sellerProfiles: SellerProfile[];
  assets: Asset[];
  messages: Message[];
  dealRooms: DealRoom[];
};

export type UserWithProfiles = User & {
  buyerProfile: BuyerProfile | null;
  sellerProfile: SellerProfile | null;
};

export type AssetWithSeller = Asset & {
  seller: Pick<User, "id" | "name" | "company" | "role" | "status"> & {
    sellerProfile: SellerProfile | null;
  };
};
