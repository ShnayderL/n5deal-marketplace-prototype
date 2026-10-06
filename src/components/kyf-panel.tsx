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

const ringColor: Record<KyfReport["grade"], string> = {
  A: "#10b981",
  B: "#14b8a6",
  C: "#f59e0b",
  D: "#ef4444",
};

export function KyfRing({
  score,
  grade,
  size = 56,
  dark = false,
}: {
  score: number;
  grade: KyfReport["grade"];
  size?: number;
  dark?: boolean;
}) {
  const stroke = Math.max(4, Math.round(size / 11));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`KYF Deal Readiness ${score}/100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={dark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.08)"}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor[grade]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={`font-display font-bold ${dark ? "text-white" : "text-[var(--text)]"}`} style={{ fontSize: size * 0.3 }}>
          {grade}
        </span>
        <span className={dark ? "text-white/60" : "text-[var(--muted)]"} style={{ fontSize: Math.max(9, size * 0.16) }}>
          {score}
        </span>
      </div>
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
