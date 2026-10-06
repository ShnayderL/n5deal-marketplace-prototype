"use client";

import { useState, useTransition } from "react";
import { verifyBuyerFundsAction, verifyBuyerIdentityAction } from "@/app/actions";
import { formatMoney } from "@/lib/utils";

export function TrustGatePanel({
  identityVerified,
  fundsVerified,
  verifiedFundsAmount,
}: {
  identityVerified: boolean;
  fundsVerified: boolean;
  verifiedFundsAmount: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="surface space-y-4 p-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Trust Gate</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Sellers prioritize buyers with verified identity and funds — same playbook as Acquire / Empire Flippers.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`badge ${identityVerified ? "badge-accent" : ""}`}>
          {identityVerified ? "Identity verified" : "Identity pending"}
        </span>
        <span className={`badge ${fundsVerified ? "badge-accent" : ""}`}>
          {fundsVerified
            ? `Funds verified · ${formatMoney(verifiedFundsAmount || 0)}`
            : "Funds pending"}
        </span>
      </div>

      {!identityVerified ? (
        <button
          type="button"
          className="btn btn-secondary"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await verifyBuyerIdentityAction();
              if (result?.error) setError(result.error);
              else {
                setError(null);
                setMessage("Identity verified (demo attestation).");
              }
            });
          }}
        >
          {pending ? "Verifying…" : "Verify identity"}
        </button>
      ) : null}

      {identityVerified && !fundsVerified ? (
        <form
          className="flex flex-wrap items-end gap-3"
          action={(formData) => {
            startTransition(async () => {
              const result = await verifyBuyerFundsAction(formData);
              if (result?.error) setError(result.error);
              else {
                setError(null);
                setMessage("Funds verified — sellers will see your capital band.");
              }
            });
          }}
        >
          <div className="min-w-48 flex-1">
            <label className="label" htmlFor="verifiedFundsAmount">
              Available acquisition funds (EUR)
            </label>
            <input
              className="input"
              id="verifiedFundsAmount"
              name="verifiedFundsAmount"
              type="number"
              required
              min={100000}
              placeholder="2500000"
            />
          </div>
          <button className="btn btn-primary" disabled={pending} type="submit">
            {pending ? "Submitting…" : "Verify funds"}
          </button>
        </form>
      ) : null}

      {identityVerified && fundsVerified ? (
        <p className="text-sm text-[var(--success)]">
          You are marked as a serious buyer. Discrete listings and sellers will prioritize your outreach.
        </p>
      ) : null}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
    </div>
  );
}
