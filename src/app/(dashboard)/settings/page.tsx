import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Instellingen"
        description="Beheer accommodatie-instellingen"
      />
      <EmptyState
        icon={<Settings className="h-10 w-10 text-neutral-400" />}
        title="Instellingen"
        description="De instellingenmodule wordt gebouwd in de settings-epic."
      />
    </div>
  );
}
