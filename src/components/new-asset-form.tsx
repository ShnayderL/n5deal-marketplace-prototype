"use client";

import { useState, useTransition } from "react";
import { createAssetAction } from "@/app/actions";
import { validateAssetDraft } from "@/lib/ai";
import { CATEGORIES, JURISDICTIONS } from "@/lib/constants";

export function NewAssetForm() {
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="surface space-y-4 p-6"
      action={(formData) => {
        const draft = {
          title: String(formData.get("title") || ""),
          summary: String(formData.get("summary") || ""),
          description: String(formData.get("description") || ""),
          category: String(formData.get("category") || ""),
          jurisdiction: String(formData.get("jurisdiction") || ""),
          askingPrice: Number(formData.get("askingPrice") || 0),
        };
        const local = validateAssetDraft(draft);
        setWarnings(local.warnings);
        if (!local.ok) {
          setError(local.errors.join(" "));
          return;
        }
        startTransition(async () => {
          const result = await createAssetAction(formData);
          if (result?.error) {
            setError(result.error);
            setWarnings(result.warnings || []);
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" name="title" required placeholder="Lithuanian EMI with EU passporting" />
        <Field label="Asking price (EUR)" name="askingPrice" type="number" required placeholder="2800000" />
        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <select className="select" id="category" name="category" required defaultValue="EMI">
            {CATEGORIES.map((c) => (
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
          <select className="select" id="jurisdiction" name="jurisdiction" required defaultValue="Lithuania">
            {JURISDICTIONS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
        <Field label="License type" name="licenseType" placeholder="EMI / VASP / …" />
        <div>
          <label className="label" htmlFor="dealReadiness">
            Deal readiness
          </label>
          <select className="select" id="dealReadiness" name="dealReadiness" defaultValue="READY">
            <option value="EXPLORING">Exploring</option>
            <option value="READY">Ready</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <Field label="Annual revenue (EUR)" name="annualRevenue" type="number" placeholder="optional" />
        <Field label="Employees" name="employees" type="number" placeholder="optional" />
      </div>

      <div>
        <label className="label" htmlFor="summary">
          Summary
        </label>
        <textarea className="textarea" id="summary" name="summary" required placeholder="One-paragraph teaser for the listing card." />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Full description
        </label>
        <textarea
          className="textarea min-h-40"
          id="description"
          name="description"
          required
          placeholder="License status, traction, deal structure, exclusions…"
        />
      </div>
      <Field label="Tags (comma-separated)" name="tags" placeholder="emi,sepa,regulated" />

      <div>
        <label className="label" htmlFor="status">
          Publish state
        </label>
        <select className="select" id="status" name="status" defaultValue="PUBLISHED">
          <option value="PUBLISHED">Publish now</option>
          <option value="DRAFT">Save as draft</option>
        </select>
      </div>

      {warnings.length ? (
        <div className="rounded-xl border border-[rgba(240,180,41,0.35)] bg-[rgba(240,180,41,0.08)] p-3 text-sm text-[#ffe4a3]">
          <div className="font-semibold">AI validation suggestions</div>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Publishing…" : "Publish asset"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input className="input" id={name} name={name} type={type} required={required} placeholder={placeholder} />
    </div>
  );
}
