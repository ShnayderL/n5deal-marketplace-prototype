import { createHash } from "crypto";

export function hashPassword(password: string) {
  return createHash("sha256").update(`n5deal:${password}`).digest("hex");
}

export function verifyPassword(password: string, passwordHash: string) {
  return hashPassword(password) === passwordHash;
}
