import { redirect } from "next/navigation";
import { BuyerProfileForm, SellerProfileForm } from "@/components/profile-forms";
import { PageShell } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/store";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "MANAGER") redirect("/manager");

  const user = store.getUserById(session.id);

  if (session.role === "BUYER") {
    return (
      <PageShell
        title="Buyer profile"
        subtitle="Define your acquisition mandate — banking, passporting, services, and timeline drive Mandate Matcher."
      >
        <BuyerProfileForm
          initial={{
            company: user?.company || "",
            headline: user?.buyerProfile?.headline || "",
            interests: user?.buyerProfile?.interests || "",
            preferredCategories: user?.buyerProfile?.preferredCategories || "",
            preferredJurisdictions: user?.buyerProfile?.preferredJurisdictions || "",
            budgetMin: user?.buyerProfile?.budgetMin || 0,
            budgetMax: user?.buyerProfile?.budgetMax || 0,
            ticketNote: user?.buyerProfile?.ticketNote || "",
            requiresBanking: user?.buyerProfile?.requiresBanking || false,
            requiresPassporting: user?.buyerProfile?.requiresPassporting || false,
            timelineWeeks: user?.buyerProfile?.timelineWeeks ?? "",
            servicesNeeded: user?.buyerProfile?.servicesNeeded || "",
          }}
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Seller profile" subtitle="This profile is shown to buyers on your asset pages.">
      <SellerProfileForm
        initial={{
          companyName: user?.sellerProfile?.companyName || user?.company || "",
          bio: user?.sellerProfile?.bio || "",
          website: user?.sellerProfile?.website || "",
        }}
      />
    </PageShell>
  );
}
