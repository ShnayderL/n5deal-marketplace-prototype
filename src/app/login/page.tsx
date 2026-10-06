import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms";
import { PageShell } from "@/components/ui";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "MANAGER" ? "/manager" : session.role === "SELLER" ? "/seller" : "/buyer");
  }

  return (
    <PageShell
      title="Access the marketplace"
      subtitle="Sign in to manage mandates, listings, and deal conversations — or explore instantly with a role workspace."
    >
      <LoginForm />
    </PageShell>
  );
}
