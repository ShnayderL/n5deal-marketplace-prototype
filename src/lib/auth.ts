import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { store } from "./store";
import type { Role, UserStatus } from "./types";

const COOKIE_NAME = "n5deal_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  company: string | null;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET || "n5deal-prototype-dev-secret-change-in-prod";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    company: user.company,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;

    const user = store.getUserById(payload.sub);
    if (!user || user.status === "SUSPENDED") return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      company: user.company,
    };
  } catch {
    return null;
  }
}

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (roles && !roles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
