import { redirect } from "next/navigation";
import { BuyerCard } from "@/components/cards";
import { EmptyState, PageShell } from "@/components/ui";
import { parseSmartQuery } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";

type SearchParams = Promise<{ q?: string; smart?: string }>;

export default async function BuyersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SELLER" && session.role !== "MANAGER") redirect("/");

  const params = await searchParams;
  const smart = params.smart ? parseSmartQuery(params.smart) : null;

  let buyers = store.listUsers({
    role: "BUYER",
    status: session.role === "MANAGER" ? undefined : "ACTIVE",
    q: params.q,
  });

  if (smart?.categories.length) {
    buyers = buyers.filter((b) =>
      smart.categories.some((c) =>
        (b.buyerProfile?.preferredCategories || "").toLowerCase().includes(c.toLowerCase()),
      ),
    );
  }
  if (smart?.jurisdictions.length) {
    buyers = buyers.filter((b) =>
      smart.jurisdictions.some((j) =>
        (b.buyerProfile?.preferredJurisdictions || "").toLowerCase().includes(j.toLowerCase()),
      ),
    );
  }

  return (
    <PageShell
      title="Buyers directory"
      subtitle="Search and filter acquisition-ready buyers. Sellers can open a profile and send a contact message."
    >
      <form className="surface mb-6 grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]" action="/buyers" method="get">
        <div>
          <label className="label" htmlFor="q">
            Search
          </label>
          <input className="input" id="q" name="q" defaultValue={params.q} placeholder="Name, company, interests…" />
        </div>
        <div>
          <label className="label" htmlFor="smart">
            AI smart filter
          </label>
          <input
            className="input"
            id="smart"
            name="smart"
            defaultValue={params.smart}
            placeholder="e.g. EMI Lithuania or crypto Singapore"
          />
        </div>
        <div className="flex items-end">
          <button className="btn btn-primary w-full" type="submit">
            Filter
          </button>
        </div>
      </form>

      {buyers.length === 0 ? (
        <EmptyState title="No buyers found" body="Adjust search terms or clear the AI filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {buyers.map((buyer) => (
            <BuyerCard key={buyer.id} buyer={buyer} href={`/buyers/${buyer.id}`} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
