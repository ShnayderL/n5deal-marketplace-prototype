import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@/lib/types";

const COOKIE_NAME = "n5deal_session";

const PROTECTED: { prefix: string; roles?: Role[] }[] = [
  { prefix: "/buyer", roles: ["BUYER"] },
  { prefix: "/seller", roles: ["SELLER"] },
  { prefix: "/manager", roles: ["MANAGER"] },
  { prefix: "/messages", roles: ["BUYER", "SELLER"] },
  { prefix: "/profile", roles: ["BUYER", "SELLER"] },
  { prefix: "/buyers", roles: ["SELLER", "MANAGER"] },
  { prefix: "/assets/new", roles: ["SELLER"] },
];

function getSecret() {
  const secret = process.env.AUTH_SECRET || "n5deal-prototype-dev-secret-change-in-prod";
  return new TextEncoder().encode(secret);
}

async function readSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.role !== "string") return null;
    if (payload.status === "SUSPENDED") return null;
    return {
      id: String(payload.sub),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request);

  const rule = PROTECTED.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );

  if (rule) {
    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (rule.roles && !rule.roles.includes(session.role)) {
      const home = new URL("/", request.url);
      return NextResponse.redirect(home);
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-frame-options", "DENY");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
