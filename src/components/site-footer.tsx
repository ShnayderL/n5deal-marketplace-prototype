import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { IMAGES } from "@/lib/images";

const columns = [
  {
    title: "Sellers",
    links: [
      { label: "Sell Your Fintech", href: "/assets/new" },
      { label: "Ways to Sell Business", href: "/seller" },
      { label: "Access Exclusive Deals", href: "/login" },
    ],
  },
  {
    title: "Buyers",
    links: [
      { label: "Browse Fintech Assets", href: "/assets" },
      { label: "Evaluation & Offer", href: "/buyer" },
      { label: "Successful Acquisitions", href: "/assets" },
    ],
  },
  {
    title: "Partner",
    links: [
      { label: "Unlock Exclusive Benefits", href: "/login" },
      { label: "Enrollment Now", href: "/login" },
      { label: "Why N5Deal", href: "/" },
    ],
  },
  {
    title: "Incorporation License",
    links: [
      { label: "Regulatory Map", href: "/assets?category=License" },
      { label: "All Incorporations", href: "/assets" },
      { label: "Fintech · Crypto", href: "/assets?category=Crypto" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Market News", href: "/assets" },
      { label: "Articles", href: "/assets" },
      { label: "Reports", href: "/assets" },
      { label: "Events", href: "/assets" },
      { label: "Glossary", href: "/assets" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "/assets" },
      { label: "support@n5deal.com", href: "mailto:support@n5deal.com" },
      { label: "Schedule a call", href: "/login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-[var(--border)] bg-[var(--bg-soft)]">
      <div className="pointer-events-none absolute -right-24 top-0 hidden h-full w-[420px] opacity-30 lg:block">
        <div className="relative h-full min-h-[320px] w-full">
          <Image src={IMAGES.skyline} alt="" fill className="object-cover object-left" sizes="420px" />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Logo size="xl" showTagline />
          <p className="max-w-md text-sm text-[var(--muted)]">
            Structured M&A marketplace for fintech, banking, and digital financial assets — prototype for
            technical evaluation.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-bold text-[var(--text)]">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--muted)] transition hover:text-[var(--accent-2)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-[var(--border)] pt-8">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[var(--muted)]">
            {[
              "Terms of Service",
              "Privacy Policy",
              "Success Fee Credit Program",
              "Cookie Policy",
              "Cookie Settings",
              "Do Not Sell or Share My Personal Information",
            ].map((item) => (
              <Link key={item} href={item.includes("Cookie") ? "/cookies" : "/privacy"} className="hover:text-[var(--text)]">
                {item}
              </Link>
            ))}
          </div>
          <Logo size="lg" />
          <p className="text-center text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} N5Deal prototype · Demo data only
          </p>
        </div>
      </div>
    </footer>
  );
}
