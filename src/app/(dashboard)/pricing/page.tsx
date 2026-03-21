import { PageHeader } from "@/components/shared/page-header";
import { PricingForm } from "@/components/pricing/pricing-form";
import { CostItemsList } from "@/components/pricing/cost-items-list";
import { SeasonsManager } from "@/components/pricing/seasons-manager";
import { SpecialArrangementsList } from "@/components/pricing/special-arrangements-list";
import { getPricingSettings } from "@/lib/actions/pricing-actions";
import { getCostItems } from "@/lib/actions/cost-item-actions";
import { getSeasonsByYear } from "@/lib/actions/season-actions";
import { getSpecialArrangementsByYear } from "@/lib/actions/special-arrangement-actions";

export default async function PricingPage() {
  const currentYear = new Date().getFullYear();

  const [settings, costItemsData, seasonData, arrangements] =
    await Promise.all([
      getPricingSettings(),
      getCostItems(),
      getSeasonsByYear(currentYear),
      getSpecialArrangementsByYear(currentYear),
    ]);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Prijzen"
        description="Beheer tarieven, seizoenen, kostenposten en speciale arrangementen"
      />

      <SeasonsManager
        year={currentYear}
        seasonRows={seasonData.allSeasonRows}
        prices={seasonData.prices}
      />

      <SpecialArrangementsList
        year={currentYear}
        arrangements={arrangements}
      />

      <CostItemsList items={costItemsData} />

      <PricingForm
        settings={{
          strategy: settings.strategy,
          basePrice: settings.basePrice,
          cleaningFee: settings.cleaningFee,
          depositAmount: settings.depositAmount,
        }}
      />
    </div>
  );
}
