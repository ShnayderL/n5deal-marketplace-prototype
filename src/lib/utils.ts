export function formatMoney(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function splitCsv(value: string | null | undefined) {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function joinCsv(values: string[]) {
  return values.map((v) => v.trim()).filter(Boolean).join(",");
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
