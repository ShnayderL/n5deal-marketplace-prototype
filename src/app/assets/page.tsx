import Image from "next/image";
import Link from "next/link";
import { AssetCard } from "@/components/cards";
import { AssetFilters } from "@/components/forms";
import { Logo } from "@/components/logo";
import { EmptyState, PageShell } from "@/components/ui";
import { IMAGES } from "@/lib/images";
import { parseSmartQuery, scoreAssetForBuyer } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { CATEGORIES, JURISDICTIONS } from "@/lib/constants";
import { store } from "@/lib/store";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  jurisdiction?: string;
  smart?: string;
}>;

export default async function AssetsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getSession();
  const smart = params.smart ? parseSmartQuery(params.smart) : null;

  let assets = store.listAssets({
    status: "PUBLISHED",
    q: params.q,
    category: params.category || smart?.categories[0],
    jurisdiction: params.jurisdiction || smart?.jurisdictions[0],
    minPrice: smart?.minPrice,
    maxPrice: smart?.maxPrice,
  });

  if (smart && smart.categories.length > 1) {
    assets = assets.filter((a) =>
      smart.categories.some((c) => c.toLowerCase() === a.category.toLowerCase()),
    );
  }
  if (smart && smart.jurisdictions.length > 1) {
    assets = assets.filter((a) =>
      smart.jurisdictions.some((j) => j.toLowerCase() === a.jurisdiction.toLowerCase()),
    );
  }

  if (smart?.bankingRequired) {
    assets = assets.filter((a) => a.bankingStatus === "ACTIVE");
  }
  if (smart?.passportingRequired) {
    assets = assets.filter((a) => a.hasPassporting);
  }

  let enriched = assets.map((asset) => ({
    ...asset,
    matchScore: undefined as number | undefined,
    matchReasons: undefined as string[] | undefined,
  }));

  if (session?.role === "BUYER") {
    const buyer = store.getUserById(session.id);
    if (buyer?.buyerProfile) {
      enriched = assets
        .map((asset) => {
          const match = scoreAssetForBuyer(asset, buyer);
          return { ...asset, matchScore: match.score, matchReasons: match.reasons };
        })
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }
  }

  return (
    <>
      <div className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="mb-2 text-xs text-[var(--muted)]">
              <Link href="/" className="hover:text-[var(--accent-2)]">
                N5deal
              </Link>{" "}
              › All Listings
            </p>
            <Logo size="lg" />
          </div>
          <div className="relative h-28 w-full overflow-hidden rounded-2xl md:h-24 md:max-w-md">
            <Image src={IMAGES.office} alt="" fill className="object-cover" sizes="400px" />
          </div>
        </div>
      </div>
      <PageShell
        title="All listings"
        subtitle="Browse regulated fintech assets, licenses, and digital financial opportunities. Signed-in buyers see AI match scores against their profile."
      >
      <div className="space-y-6">
        <AssetFilters
          categories={[...CATEGORIES]}
          jurisdictions={[...JURISDICTIONS]}
          initial={{
            q: params.q,
            category: params.category,
            jurisdiction: params.jurisdiction,
            smart: params.smart,
          }}
        />

        {smart ? (
          <div className="rounded-2xl border border-[var(--border)] bg-teal-50 px-4 py-3 text-sm text-[var(--muted)]">
            AI interpreted:{" "}
            {[
              smart.categories.length ? `categories ${smart.categories.join(", ")}` : null,
              smart.jurisdictions.length ? `jurisdictions ${smart.jurisdictions.join(", ")}` : null,
              smart.minPrice ? `min ${smart.minPrice}` : null,
              smart.maxPrice ? `max ${smart.maxPrice}` : null,
              smart.bankingRequired ? "active banking" : null,
              smart.passportingRequired ? "passporting" : null,
            ]
              .filter(Boolean)
              .join(" · ") || "keyword search only"}
          </div>
        ) : null}

        {enriched.length === 0 ? (
          <EmptyState
            title="No assets match"
            body="Try clearing filters or broadening the AI query (e.g. “payments EU under €5m”)."
          />
        ) : (
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {enriched.map((asset, i) => (
              <div key={asset.id} className="h-full">
                <AssetCard asset={asset} imageIndex={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
    </>
  );
}
