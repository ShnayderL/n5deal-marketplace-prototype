"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";

const STORAGE_KEY = "n5deal-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept(all: boolean) {
    localStorage.setItem(STORAGE_KEY, all ? "all" : "essential");
    setVisible(false);
    setManageOpen(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4 md:p-6">
      <div
        role="dialog"
        aria-labelledby="cookie-title"
        className="cookie-panel mx-auto max-w-4xl rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] md:p-8"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Logo size="md" href="/" />
            <h2 id="cookie-title" className="mt-4 font-display text-2xl font-bold text-[var(--text)]">
              Cookies & Privacy
            </h2>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[var(--muted)]">
          We use cookies to improve your experience, analyze traffic, and personalize content. By clicking
          &quot;Accept All&quot;, you agree to our use of cookies. Read our{" "}
          <Link href="/privacy" className="font-semibold text-[var(--accent-2)] underline-offset-2 hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/cookies" className="font-semibold text-[var(--accent-2)] underline-offset-2 hover:underline">
            Cookie Policy
          </Link>
          .
        </p>

        {manageOpen ? (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm">
            <label className="flex items-center justify-between gap-3 py-2">
              <span>Essential cookies</span>
              <input type="checkbox" checked disabled className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-3 py-2">
              <span>Analytics & personalization</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--accent-2)]" />
            </label>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button type="button" className="btn btn-ghost order-3 sm:order-1" onClick={() => accept(false)}>
            Reject non-essential
          </button>
          <button
            type="button"
            className="btn btn-secondary order-2 sm:order-2"
            onClick={() => setManageOpen((v) => !v)}
          >
            Manage Preferences
          </button>
          <button type="button" className="btn btn-primary order-1 sm:order-3 sm:ml-auto" onClick={() => accept(true)}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
