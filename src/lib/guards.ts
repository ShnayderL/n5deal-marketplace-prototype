import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Role } from "@/lib/types";

/** Server-side route guard — redirects instead of throwing for page flows. */
export async function guardSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.role)) {
    if (session.role === "MANAGER") redirect("/manager");
    if (session.role === "SELLER") redirect("/seller");
    redirect("/buyer");
  }
  return session;
}
