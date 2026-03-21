import { PageHeader } from "@/components/shared/page-header";
import { PricingForm } from "@/components/pricing/pricing-form";
import { CostItemsList } from "@/components/pricing/cost-items-list";
import { getPricingSettings } from "@/lib/actions/pricing-actions";
import { getCostItems } from "@/lib/actions/cost-item-actions";

export default async function PricingPage() {
  const [settings, costItemsData] = await Promise.all([
    getPricingSettings(),
    getCostItems(),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Prijzen"
        description="Beheer basisprijs, kostenposten en upgrades. Deze prijzen worden automatisch overgenomen door de website."
      />
      <PricingForm
        settings={{
          strategy: settings.strategy,
          basePrice: settings.basePrice,
          cleaningFee: settings.cleaningFee,
          depositAmount: settings.depositAmount,
        }}
      />
      <CostItemsList items={costItemsData} />
    </div>
  );
}
