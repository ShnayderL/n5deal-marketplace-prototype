import Link from "next/link";
import { redirect } from "next/navigation";
import { NewAssetForm } from "@/components/new-asset-form";
import { PageShell } from "@/components/ui";
import { getSession } from "@/lib/auth";

export default async function NewAssetPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SELLER") redirect("/assets");

  return (
    <PageShell
      title="Publish an asset"
      subtitle="Create a structured Asset ID-style listing. AI validation checks completeness before publish."
      actions={
        <Link href="/seller" className="btn btn-ghost">
          Seller dashboard
        </Link>
      }
    >
      <NewAssetForm />
    </PageShell>
  );
}
