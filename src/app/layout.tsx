import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/ui";
import { getSession } from "@/lib/auth";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "N5Deal Marketplace Prototype",
  description:
    "M&A marketplace prototype for fintech and financial assets — buyers, sellers, and platform managers.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || undefined;

  return (
    <html lang="en" className={`${manrope.variable} ${syne.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader user={session} pathname={pathname} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] py-6 text-center text-sm text-[var(--muted)]">
          N5Deal marketplace prototype · demo data only · not affiliated with production N5Deal systems
        </footer>
      </body>
    </html>
  );
}
