import Link from "next/link";
import type { Role } from "@/lib/types";
import { logoutAction } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

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

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(7,17,31,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          N5<span className="text-[var(--accent)]">Deal</span>
          <span className="ml-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Prototype
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {!user && (
            <>
              <Link className="rounded-full px-3 py-2 text-sm text-[var(--muted)] hover:text-white" href="/assets">
                Browse assets
              </Link>
              <Link className="rounded-full px-3 py-2 text-sm text-[var(--muted)] hover:text-white" href="/login">
                Sign in
              </Link>
            </>
          )}
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm text-[var(--muted)] hover:text-white",
                pathname === link.href && "bg-white/5 text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{user.role}</div>
              </div>
              <form action={logoutAction}>
                <button className="btn btn-ghost" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">
              Enter marketplace
            </Link>
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
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
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
