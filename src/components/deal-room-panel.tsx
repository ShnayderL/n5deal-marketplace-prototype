"use client";

import { useState, useTransition } from "react";
import {
  advanceDealStageAction,
  openDealInterestAction,
  signNdaAction,
  toggleCocChecklistAction,
} from "@/app/actions";
import type { CocKit } from "@/lib/coc";
import { DEAL_STAGES, stageOrder } from "@/lib/deals";
import type { DealRoom } from "@/lib/types";

export function DealRoomPanel({
  assetId,
  room,
  kit,
  progress,
  canSignNda,
  trustHint,
}: {
  assetId: string;
  room: DealRoom | null;
  kit: CocKit;
  progress: { done: number; total: number; criticalDone: number; criticalTotal: number; pct: number; readyForLoi: boolean };
  canSignNda: boolean;
  trustHint?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentOrder = room ? stageOrder(room.stage) : -1;

  function run(action: () => Promise<{ error?: string; success?: boolean } | void>) {
    startTransition(async () => {
      const result = await action();
      if (result && "error" in result && result.error) setError(result.error);
      else setError(null);
    });
  }

  return (
    <div className="surface space-y-5 p-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Deal Room</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Interest → NDA → data room → CoC kit ({kit.regulator}, ~{kit.typicalWeeks} wks) → LOI
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DEAL_STAGES.map((s) => {
          const active = currentOrder >= s.order;
          return (
            <span key={s.id} className={`badge ${active ? "badge-accent" : ""}`}>
              {s.label}
            </span>
          );
        })}
      </div>

      {!room ? (
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={() => run(() => openDealInterestAction(assetId))}
        >
          {pending ? "Opening…" : "Register interest"}
        </button>
      ) : null}

      {room && !room.ndaSignedAt ? (
        <div className="space-y-2">
          {trustHint ? <p className="text-sm text-[var(--muted)]">{trustHint}</p> : null}
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending || !canSignNda}
            onClick={() => run(() => signNdaAction(assetId))}
          >
            {pending ? "Signing…" : "Sign mutual NDA"}
          </button>
          {!canSignNda ? (
            <p className="text-xs text-[var(--danger)]">Verify identity in Profile to unlock NDA.</p>
          ) : null}
        </div>
      ) : null}

      {room?.ndaSignedAt ? (
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">CoC checklist</span>
              <span className="text-[var(--muted)]">
                {progress.done}/{progress.total} · critical {progress.criticalDone}/{progress.criticalTotal}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">{kit.summary}</p>
          </div>

          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {kit.items.map((item) => {
              const checked = room.checklistDone.includes(item.key);
              return (
                <li key={item.key}>
                  <label className="flex cursor-pointer gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-[var(--accent)]"
                      checked={checked}
                      disabled={pending}
                      onChange={() => run(() => toggleCocChecklistAction(assetId, item.key))}
                    />
                    <span>
                      <span className="font-medium">
                        {item.label}
                        {item.critical ? (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--danger)]">
                            critical
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--muted)]">{item.detail}</span>
                      <span className="mt-1 block text-[10px] uppercase text-[var(--muted)]">
                        Owner: {item.owner}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {room.stage !== "LOI_SENT" ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pending}
              onClick={() => run(() => advanceDealStageAction(assetId))}
            >
              {pending
                ? "Updating…"
                : progress.readyForLoi
                  ? "Advance to LOI"
                  : "Advance deal stage"}
            </button>
          ) : (
            <p className="text-sm text-[var(--success)]">LOI stage marked — seller has been notified.</p>
          )}
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
