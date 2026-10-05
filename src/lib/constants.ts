export const CATEGORIES = [
  "EMI",
  "Payments",
  "Crypto",
  "VASP",
  "Blockchain",
  "Neobank",
  "Lending",
  "BNPL",
  "Banking",
  "License",
  "Shelf Company",
  "Fintech",
] as const;

export const JURISDICTIONS = [
  "Lithuania",
  "Estonia",
  "Cyprus",
  "Malta",
  "Singapore",
  "Hong Kong",
  "Dubai",
  "UAE",
  "UK",
  "Germany",
  "Spain",
  "Portugal",
  "Netherlands",
  "Mauritius",
  "Cayman",
] as const;

export const DEMO_ACCOUNTS = [
  {
    email: "buyer@n5deal.demo",
    role: "BUYER" as const,
    label: "Buyer — Elena Voss",
    description: "Family office · EMI / payments mandate",
  },
  {
    email: "seller@n5deal.demo",
    role: "SELLER" as const,
    label: "Seller — Viktor Radek",
    description: "Baltic Pay Group · licensed EMI operator",
  },
  {
    email: "manager@n5deal.demo",
    role: "MANAGER" as const,
    label: "Manager — Alex Morgan",
    description: "Platform compliance & oversight",
  },
] as const;

export const DEMO_PASSWORD = "demo1234";
