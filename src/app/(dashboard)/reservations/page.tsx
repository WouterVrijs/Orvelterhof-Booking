import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ReservationFilters } from "@/components/reservations/reservation-filters";
import { ReservationTable } from "@/components/reservations/reservation-table";
import {
  getReservations,
  type SortField,
  type SortOrder,
} from "@/lib/services/reservations";
import type { ReservationStatus } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function ReservationsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const validStatuses: ReservationStatus[] = [
    "NEW",
    "IN_PROGRESS",
    "CONFIRMED",
    "CANCELLED",
  ];
  const validSortFields: SortField[] = [
    "arrivalDate",
    "departureDate",
    "createdAt",
  ];

  const status = validStatuses.includes(params.status as ReservationStatus)
    ? (params.status as ReservationStatus)
    : null;
  const sortBy = validSortFields.includes(params.sortBy as SortField)
    ? (params.sortBy as SortField)
    : "createdAt";
  const sortOrder: SortOrder =
    params.sortOrder === "asc" ? "asc" : "desc";

  const reservations = await getReservations({
    status,
    search: params.search || null,
    sortBy,
    sortOrder,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reserveringen"
        description={`${reservations.length} reservering${reservations.length !== 1 ? "en" : ""}`}
      >
        <Link href="/reservations/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nieuwe reservering
          </Button>
        </Link>
      </PageHeader>

      <Suspense>
        <ReservationFilters />
      </Suspense>

      <ReservationTable reservations={reservations} />
    </div>
  );
}
