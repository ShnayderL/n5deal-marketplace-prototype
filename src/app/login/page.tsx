import { LoginForm } from "@/components/forms";
import { PageShell } from "@/components/ui";

export default function LoginPage() {
  return (
    <PageShell
      title="Access the marketplace"
      subtitle="Sign in to manage mandates, listings, and deal conversations — or explore instantly with a role workspace."
    >
      <LoginForm />
    </PageShell>
  );
}
