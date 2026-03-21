import { db } from "@/lib/db";
import { reservations, blockedPeriods } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { BlockedPeriodsList } from "@/components/calendar/blocked-periods-list";
import type { ReservationStatus, BlockType } from "@/lib/types";

export default async function CalendarPage() {
  const calendarReservations = await db
    .select({
      id: reservations.id,
      arrivalDate: reservations.arrivalDate,
      departureDate: reservations.departureDate,
      status: reservations.status,
      firstName: reservations.firstName,
      lastName: reservations.lastName,
    })
    .from(reservations)
    .where(
      inArray(reservations.status, ["NEW", "IN_PROGRESS", "CONFIRMED"])
    );

  const calendarBlocks = await db
    .select()
    .from(blockedPeriods);

  const mappedReservations = calendarReservations.map((r) => ({
    id: r.id,
    arrivalDate: new Date(r.arrivalDate),
    departureDate: new Date(r.departureDate),
    status: r.status as ReservationStatus,
    firstName: r.firstName,
    lastName: r.lastName,
  }));

  const mappedBlocks = calendarBlocks.map((b) => ({
    id: b.id,
    startDate: new Date(b.startDate),
    endDate: new Date(b.endDate),
    blockType: b.blockType as BlockType,
    reason: b.reason,
  }));

  // Plain objects for the blocked periods list (client component)
  const blocksList = calendarBlocks.map((b) => ({
    id: b.id,
    startDate: b.startDate,
    endDate: b.endDate,
    reason: b.reason,
    blockType: b.blockType,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender"
        description="Bekijk beschikbaarheid, reserveringen en geblokkeerde periodes"
      />
      <CalendarView
        reservations={mappedReservations}
        blockedPeriods={mappedBlocks}
      />
      <BlockedPeriodsList periods={blocksList} />
    </div>
  );
}
