import { LoginForm } from "@/components/forms";
import { PageShell } from "@/components/ui";

export default function LoginPage() {
  return (
    <PageShell
      title="Access the marketplace"
      subtitle="Use demo accounts to evaluate Buyer, Seller, and Platform Manager flows. State persists in SQLite across refresh."
    >
      <LoginForm />
    </PageShell>
  );
}
