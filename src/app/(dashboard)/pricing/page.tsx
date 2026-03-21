import { PageHeader } from "@/components/shared/page-header";
import { PricingForm } from "@/components/pricing/pricing-form";
import { getPricingSettings } from "@/lib/actions/pricing-actions";

export default async function PricingPage() {
  const settings = await getPricingSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Prijzen"
        description="Beheer basisprijs, schoonmaakkosten en borgsom"
      />
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
