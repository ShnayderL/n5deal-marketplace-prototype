import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { headers } from "next/headers";
import { ChatAssistant } from "@/components/chat-assistant";
import { CookieBanner } from "@/components/cookie-banner";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter } from "@/components/site-footer";
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
  icons: { icon: "/n5deal-logo.png" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || undefined;

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-20 md:pb-0">
        <SiteHeader user={session} pathname={pathname} />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <SiteFooter />
        <CookieBanner />
        <ChatAssistant />
      </body>
    </html>
  );
}
