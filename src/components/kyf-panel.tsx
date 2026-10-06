import type { KyfReport } from "@/lib/kyf";

const gradeClass: Record<KyfReport["grade"], string> = {
  A: "badge-accent",
  B: "badge-warn",
  C: "badge",
  D: "badge",
};

export function KyfPanel({ report }: { report: KyfReport }) {
  return (
    <div className="surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">KYF Deal Readiness</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Banking, compliance, passporting & CoC signals buyers shortlist on.
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-bold text-[var(--accent-2)]">{report.score}</div>
          <span className={`badge ${gradeClass[report.grade]}`}>
            Grade {report.grade} · {report.label}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {report.factors.map((factor) => (
          <div key={factor.key}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{factor.label}</span>
              <span className="text-[var(--muted)]">
                {factor.score}/{factor.max}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-soft)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
                style={{ width: `${Math.round((factor.score / factor.max) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">{factor.detail}</p>
          </div>
        ))}
      </div>

      {report.strengths.length ? (
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--success)]">Strengths</div>
          <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
            {report.strengths.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.blockers.length ? (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">Watchouts</div>
          <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
            {report.blockers.map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function KyfBadge({ score, grade }: { score: number; grade: KyfReport["grade"] }) {
  return (
    <span className={`badge ${gradeClass[grade]}`}>
      KYF {grade} · {score}
    </span>
  );
}
