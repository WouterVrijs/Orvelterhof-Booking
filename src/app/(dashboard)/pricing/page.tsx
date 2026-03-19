import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Euro } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prijzen"
        description="Beheer prijsinstellingen"
      />
      <EmptyState
        icon={<Euro className="h-10 w-10 text-neutral-400" />}
        title="Prijzen"
        description="De prijzenmodule wordt gebouwd in de pricing-epic."
      />
    </div>
  );
}
