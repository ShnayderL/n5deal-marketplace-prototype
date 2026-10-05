import { Logo } from "@/components/logo";
import { PageShell } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" subtitle="Prototype policy text for demo purposes only.">
      <div className="surface max-w-3xl space-y-4 p-6 text-sm leading-relaxed text-[var(--muted)]">
        <Logo size="sm" />
        <p>
          N5Deal prototype stores demo account data locally in a JSON file. We do not sell personal data. Contact
          messages are visible only to the participants and platform manager in this demo environment.
        </p>
        <p>
          For production, this page would describe lawful bases, retention, subprocessors, and regional rights
          (GDPR, CCPA).
        </p>
      </div>
    </PageShell>
  );
}
