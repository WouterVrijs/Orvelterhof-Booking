import { PageHeader } from "@/components/shared/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { getAccommodationSettings } from "@/lib/actions/settings-actions";

export default async function SettingsPage() {
  const settings = await getAccommodationSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Instellingen"
        description="Beheer accommodatiegegevens, boekingsregels en standaard kosten"
      />
      <SettingsForm
        settings={{
          accommodationName: settings.accommodationName,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          checkInTime: settings.checkInTime,
          checkOutTime: settings.checkOutTime,
          maxGuests: settings.maxGuests,
          minStayNights: settings.minStayNights,
          defaultCleaningFee: settings.defaultCleaningFee,
          defaultDeposit: settings.defaultDeposit,
        }}
      />
    </div>
  );
}
