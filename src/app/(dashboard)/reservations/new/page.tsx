import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CreateReservationForm } from "@/components/reservations/create-reservation-form";

interface PageProps {
  searchParams: Promise<{ arrivalDate?: string }>;
}

export default async function NewReservationPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reservations"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar overzicht
        </Link>
        <PageHeader
          title="Nieuwe reservering"
          description="Maak handmatig een nieuwe reservering aan"
        />
      </div>

      <CreateReservationForm defaultArrivalDate={params.arrivalDate} />
    </div>
  );
}
