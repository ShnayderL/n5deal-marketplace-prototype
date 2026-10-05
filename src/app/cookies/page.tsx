import { Logo } from "@/components/logo";
import { PageShell } from "@/components/ui";

export default function CookiesPage() {
  return (
    <PageShell title="Cookie Policy" subtitle="How cookies are used in this prototype.">
      <div className="surface max-w-3xl space-y-4 p-6 text-sm leading-relaxed text-[var(--muted)]">
        <Logo size="sm" />
        <p>
          Essential cookies include your session cookie after sign-in. The cookie consent banner stores your
          preference in local storage (`n5deal-cookie-consent`).
        </p>
        <p>Non-essential analytics cookies are disabled until you accept them in the banner.</p>
      </div>
    </PageShell>
  );
}
