"use client";

import { useMemo, useState, useTransition } from "react";
import { demoLoginAction, loginAction } from "@/app/actions";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/constants";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form
        className="surface p-6"
        action={(formData) => {
          startTransition(async () => {
            const result = await loginAction(formData);
            if (result?.error) setError(result.error);
          });
        }}
      >
        <h2 className="font-display text-2xl font-semibold">Sign in</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Demo password for all seeded accounts: <code>{DEMO_PASSWORD}</code>
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input" id="email" name="email" type="email" required defaultValue="buyer@n5deal.demo" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input className="input" id="password" name="password" type="password" required defaultValue={DEMO_PASSWORD} />
          </div>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={pending} type="submit">
            {pending ? "Signing in…" : "Continue"}
          </button>
        </div>
      </form>

      <div className="surface p-6">
        <h2 className="font-display text-2xl font-semibold">One-click demo roles</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Jump straight into Buyer, Seller, or Platform Manager flows.
        </p>
        <div className="mt-5 space-y-3">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              className="w-full rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4 text-left transition hover:border-[var(--border-strong)]"
              disabled={pending}
              type="button"
              onClick={() => {
                startTransition(async () => {
                  const result = await demoLoginAction(account.email);
                  if (result?.error) setError(result.error);
                });
              }}
            >
              <div className="font-semibold">{account.label}</div>
              <div className="mt-1 text-sm text-[var(--muted)]">{account.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContactForm({
  toUserId,
  assetId,
  defaultSubject,
}: {
  toUserId: string;
  assetId?: string;
  defaultSubject?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="surface p-5"
      action={async (formData) => {
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const { sendMessageAction } = await import("@/app/actions");
          const result = await sendMessageAction(formData);
          if (result?.error) setError(result.error);
          else setMessage("Message sent. Check Messages for the thread.");
        });
      }}
    >
      <h3 className="font-display text-xl font-semibold">Contact</h3>
      <input type="hidden" name="toUserId" value={toUserId} />
      {assetId ? <input type="hidden" name="assetId" value={assetId} /> : null}
      <div className="mt-4 space-y-3">
        <div>
          <label className="label" htmlFor="subject">
            Subject
          </label>
          <input className="input" id="subject" name="subject" required defaultValue={defaultSubject} />
        </div>
        <div>
          <label className="label" htmlFor="body">
            Message
          </label>
          <textarea
            className="textarea"
            id="body"
            name="body"
            required
            placeholder="Introduce your mandate, timeline, and next step (NDA / call)."
          />
        </div>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

export function SmartSearchBar({
  onApply,
  placeholder,
}: {
  onApply: (query: string) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="surface p-4">
      <label className="label" htmlFor="smart-query">
        AI smart filter
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="smart-query"
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
        <button className="btn btn-secondary shrink-0" type="button" onClick={() => onApply(value)}>
          Apply AI filter
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Try: “EMI in Lithuania under €3m” or “crypto custody Estonia”
      </p>
    </div>
  );
}

export function AssetFilters({
  categories,
  jurisdictions,
  initial,
}: {
  categories: string[];
  jurisdictions: string[];
  initial?: {
    q?: string;
    category?: string;
    jurisdiction?: string;
    smart?: string;
  };
}) {
  const [smart, setSmart] = useState(initial?.smart || "");

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    if (smart) sp.set("smart", smart);
    return sp;
  }, [smart]);

  return (
    <form className="space-y-4" action="/assets" method="get">
      <SmartSearchBar
        placeholder="Describe the asset you want…"
        onApply={(query) => {
          setSmart(query);
          const next = new URLSearchParams(params);
          if (query) next.set("smart", query);
          else next.delete("smart");
          window.location.href = `/assets?${next.toString()}`;
        }}
      />
      {smart ? <input type="hidden" name="smart" value={smart} /> : null}
      <div className="surface grid gap-3 p-4 md:grid-cols-4">
        <div>
          <label className="label" htmlFor="q">
            Search
          </label>
          <input className="input" id="q" name="q" defaultValue={initial?.q} placeholder="Title, license, tags…" />
        </div>
        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <select className="select" id="category" name="category" defaultValue={initial?.category || ""}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="jurisdiction">
            Jurisdiction
          </label>
          <select className="select" id="jurisdiction" name="jurisdiction" defaultValue={initial?.jurisdiction || ""}>
            <option value="">All</option>
            {jurisdictions.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn btn-primary w-full" type="submit">
            Filter
          </button>
        </div>
      </div>
    </form>
  );
}
