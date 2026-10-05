import Link from "next/link";
import type { Role } from "@/lib/types";
import { logoutAction } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const linksByRole: Record<Role, { href: string; label: string }[]> = {
  BUYER: [
    { href: "/buyer", label: "Dashboard" },
    { href: "/assets", label: "Assets" },
    { href: "/messages", label: "Messages" },
    { href: "/profile", label: "Profile" },
  ],
  SELLER: [
    { href: "/seller", label: "Dashboard" },
    { href: "/buyers", label: "Buyers" },
    { href: "/assets/new", label: "Publish" },
    { href: "/messages", label: "Messages" },
    { href: "/profile", label: "Profile" },
  ],
  MANAGER: [
    { href: "/manager", label: "Control room" },
    { href: "/assets", label: "Assets" },
    { href: "/buyers", label: "Buyers" },
  ],
};

export function SiteHeader({
  user,
  pathname,
}: {
  user: SessionUser | null;
  pathname?: string;
}) {
  const links = user ? linksByRole[user.role] : [];
  const isListings = pathname === "/assets" || pathname?.startsWith("/assets/");

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex min-h-[78px] max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
        <Logo size="header" />

        <nav className="hidden items-center gap-1 lg:flex">
          {!user ? (
            <>
              <Link className="nav-link" href="/login?role=buyer">
                Buyer
              </Link>
              <Link className="nav-link" href="/login?role=seller">
                Seller
              </Link>
              <Link
                href="/assets"
                className={cn("nav-link", isListings && "nav-link-active")}
              >
                All Listings
              </Link>
              <Link className="nav-link" href="/assets?category=License">
                Incorporation License
              </Link>
            </>
          ) : null}
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("nav-link", pathname === link.href && "nav-link-active")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link href="/assets" className="btn btn-ghost hidden !px-3 !py-1.5 text-sm sm:inline-flex">
                Free Valuation
              </Link>
              <Link href="/login" className="btn btn-primary !px-3.5 !py-1.5 text-sm">
                Start now
              </Link>
            </>
          ) : (
            <>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{user.role}</div>
              </div>
              <form action={logoutAction}>
                <button className="btn btn-ghost text-sm" type="submit">
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PageShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="fade-up">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text)] md:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-[var(--muted)]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="fade-up-delay flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface px-6 py-12 text-center">
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}
