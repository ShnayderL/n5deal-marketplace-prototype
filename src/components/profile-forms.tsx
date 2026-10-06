"use client";

import { useState, useTransition } from "react";
import { updateBuyerProfileAction, updateSellerProfileAction } from "@/app/actions";
import { CATEGORIES, JURISDICTIONS } from "@/lib/constants";

export function BuyerProfileForm({
  initial,
}: {
  initial: {
    company: string;
    headline: string;
    interests: string;
    preferredCategories: string;
    preferredJurisdictions: string;
    budgetMin: number;
    budgetMax: number;
    ticketNote: string;
    requiresBanking: boolean;
    requiresPassporting: boolean;
    timelineWeeks: number | "";
    servicesNeeded: string;
  };
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="surface space-y-4 p-6"
      action={(formData) => {
        startTransition(async () => {
          const result = await updateBuyerProfileAction(formData);
          if (result?.error) setError(result.error);
          else {
            setError(null);
            setMessage("Mandate saved.");
          }
        });
      }}
    >
      <Field label="Company" name="company" defaultValue={initial.company} />
      <Field label="Headline" name="headline" defaultValue={initial.headline} required />
      <div>
        <label className="label" htmlFor="interests">
          Investment / acquisition interests
        </label>
        <textarea className="textarea" id="interests" name="interests" required defaultValue={initial.interests} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="preferredCategories">
            Preferred categories (comma-separated)
          </label>
          <input
            className="input"
            id="preferredCategories"
            name="preferredCategories"
            required
            defaultValue={initial.preferredCategories}
            list="categories"
          />
          <datalist id="categories">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label" htmlFor="preferredJurisdictions">
            Preferred jurisdictions (comma-separated)
          </label>
          <input
            className="input"
            id="preferredJurisdictions"
            name="preferredJurisdictions"
            required
            defaultValue={initial.preferredJurisdictions}
            list="jurisdictions"
          />
          <datalist id="jurisdictions">
            {JURISDICTIONS.map((j) => (
              <option key={j} value={j} />
            ))}
          </datalist>
        </div>
        <Field label="Budget min (EUR)" name="budgetMin" type="number" defaultValue={String(initial.budgetMin)} required />
        <Field label="Budget max (EUR)" name="budgetMax" type="number" defaultValue={String(initial.budgetMax)} required />
        <Field
          label="Timeline (weeks)"
          name="timelineWeeks"
          type="number"
          defaultValue={initial.timelineWeeks === "" ? "" : String(initial.timelineWeeks)}
          placeholder="e.g. 16"
        />
        <Field
          label="Services needed"
          name="servicesNeeded"
          defaultValue={initial.servicesNeeded}
          placeholder="e-money, SEPA, custody…"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="requiresBanking"
            defaultChecked={initial.requiresBanking}
            className="size-4 accent-[var(--accent)]"
          />
          Require active banking continuity
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="requiresPassporting"
            defaultChecked={initial.requiresPassporting}
            className="size-4 accent-[var(--accent)]"
          />
          Require EEA/UK passporting
        </label>
      </div>

      <Field label="Ticket note" name="ticketNote" defaultValue={initial.ticketNote} />
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save acquisition mandate"}
      </button>
    </form>
  );
}

export function SellerProfileForm({
  initial,
}: {
  initial: { companyName: string; bio: string; website: string };
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="surface space-y-4 p-6"
      action={(formData) => {
        startTransition(async () => {
          const result = await updateSellerProfileAction(formData);
          if (result?.error) setError(result.error);
          else {
            setError(null);
            setMessage("Profile saved.");
          }
        });
      }}
    >
      <Field label="Company name" name="companyName" defaultValue={initial.companyName} required />
      <div>
        <label className="label" htmlFor="bio">
          Bio
        </label>
        <textarea className="textarea" id="bio" name="bio" required defaultValue={initial.bio} />
      </div>
      <Field label="Website" name="website" defaultValue={initial.website} placeholder="https://" />
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save seller profile"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        className="input"
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
