"use client";

import Link from "next/link";
import { ArrowRight, Check, Lock, Minus, Sparkles, Timer } from "lucide-react";
import { useState, useTransition } from "react";
import { instantShortlistAction } from "@/app/actions";
import { Flag } from "@/components/flag";
import { KyfRing } from "@/components/kyf-panel";
import {
  BUDGETS,
  DEFAULT_SHORTLIST_INPUT,
  LICENCE_FAMILIES,
  REGIONS,
  type ShortlistResult,
} from "@/lib/shortlist";
import { formatMoney } from "@/lib/utils";

export function InstantShortlist({
  initial,
  ctaHref,
}: {
  initial: ShortlistResult;
  ctaHref: string;
}) {
  const [result, setResult] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <div id="shortlist" className="scroll-mt-28 overflow-hidden rounded-3xl border border-white/10 bg-white text-[var(--text)]">
      <form
        className="space-y-4 p-5 md:p-6"
        action={(formData) => {
          startTransition(async () => {
            setResult(await instantShortlistAction(formData));
          });
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-2)]">
              <Sparkles className="h-3.5 w-3.5" />
              Instant shortlist
            </div>
            <h2 className="mt-1 font-display text-xl font-bold">Tell us your mandate</h2>
          </div>
          <span className="badge badge-accent">No sign-up</span>
        </div>

        <fieldset>
          <legend className="label">Licence family</legend>
          <div className="flex flex-wrap gap-1.5">
            {LICENCE_FAMILIES.map((f) => (
              <label key={f.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="family"
                  value={f.id}
                  defaultChecked={f.id === DEFAULT_SHORTLIST_INPUT.family}
                  className="peer sr-only"
                />
                <span className="seg-pill">{f.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="sl-region">
              Jurisdiction
            </label>
            <select className="select !py-2.5 text-sm" id="sl-region" name="region" defaultValue={DEFAULT_SHORTLIST_INPUT.region}>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="sl-budget">
              Budget
            </label>
            <select className="select !py-2.5 text-sm" id="sl-budget" name="budgetMax" defaultValue={DEFAULT_SHORTLIST_INPUT.budgetMax}>
              {BUDGETS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="sl-timeline">
              Go-live target
            </label>
            <select className="select !py-2.5 text-sm" id="sl-timeline" name="timelineWeeks" defaultValue={DEFAULT_SHORTLIST_INPUT.timelineWeeks ?? ""}>
              <option value="8">≤ 8 weeks</option>
              <option value="12">≤ 12 weeks</option>
              <option value="16">≤ 16 weeks</option>
              <option value="">Flexible</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="requiresBanking" defaultChecked className="size-4 accent-[var(--accent-2)]" />
              Must have active banking
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="requiresPassporting" defaultChecked className="size-4 accent-[var(--accent-2)]" />
              Needs passporting
            </label>
          </div>
          <button className="btn btn-primary" disabled={pending} type="submit">
            {pending ? "Matching…" : "Get my shortlist"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="border-t border-[var(--border)] bg-[var(--bg-soft)] p-5 md:p-6">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <span>
            Scanned <b className="text-[var(--text)]">{result.scanned}</b> regulated entities ·{" "}
            <b className="text-[var(--text)]">{result.filteredOut}</b> excluded on banking, scope or CoC risk
          </span>
        </div>

        <div className={`space-y-2.5 transition-opacity ${pending ? "opacity-50" : ""}`}>
          {result.items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-white p-4 text-sm text-[var(--muted)]">
              Nothing deal-ready matches this exact mandate yet. Relax banking or passporting — or register the mandate and
              we notify you when a fitting entity is listed.
            </p>
          ) : (
            result.items.map((item, i) => (
              <Link
                key={item.id}
                href={`/assets/${item.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 transition hover:border-[var(--accent-2)]/40"
              >
                <KyfRing score={item.kyfScore} grade={item.kyfGrade} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-[var(--muted)]">#{i + 1}</span>
                    {item.discrete ? <Lock className="h-3 w-3 text-[var(--muted)]" /> : null}
                    <span className="truncate text-sm font-semibold">{item.title}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Flag jurisdiction={item.jurisdiction} size={16} />
                      <b className="font-mono text-[var(--text)]">{item.code}</b> · {item.licenseType}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {item.bankingStatus === "ACTIVE" ? (
                        <Check className="h-3 w-3 text-[var(--success)]" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      Banking
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      CoC ~{item.cocWeeks} wks
                    </span>
                  </div>
                  {item.gaps[0] ? (
                    <div className="mt-0.5 truncate text-[11px] text-[var(--warn)]">Gap: {item.gaps[0]}</div>
                  ) : item.reasons[0] ? (
                    <div className="mt-0.5 truncate text-[11px] text-[var(--success)]">{item.reasons[0]}</div>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-lg font-bold text-[var(--accent-2)]">{item.fit}%</div>
                  <div className="text-[11px] text-[var(--muted)]">{formatMoney(item.askingPrice, item.currency)}</div>
                </div>
              </Link>
            ))
          )}
        </div>

        <Link href={ctaHref} className="btn btn-dark mt-4 w-full">
          Open Deal Rooms for this shortlist
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
