import { db } from "@/lib/db";
import { reservations, blockedPeriods } from "@/lib/db/schema";
import { and, eq, lt, gt, ne } from "drizzle-orm";
import { formatDateISO } from "@/lib/utils/dates";

/**
 * Check if a date range overlaps with any confirmed reservation.
 * Optionally exclude a specific reservation (for edit scenarios).
 */
export async function hasReservationOverlap(
  arrivalDate: Date,
  departureDate: Date,
  excludeId?: string
): Promise<boolean> {
  const arrival = formatDateISO(arrivalDate);
  const departure = formatDateISO(departureDate);

  const conditions = [
    eq(reservations.status, "CONFIRMED"),
    lt(reservations.arrivalDate, departure),
    gt(reservations.departureDate, arrival),
  ];

  if (excludeId) {
    conditions.push(ne(reservations.id, excludeId));
  }

  const [result] = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(and(...conditions))
    .limit(1);

  return !!result;
}

/**
 * Check if a date range overlaps with any blocked period.
 */
export async function hasBlockedPeriodOverlap(
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  const start = formatDateISO(startDate);
  const end = formatDateISO(endDate);

  const [result] = await db
    .select({ id: blockedPeriods.id })
    .from(blockedPeriods)
    .where(
      and(
        lt(blockedPeriods.startDate, end),
        gt(blockedPeriods.endDate, start)
      )
    )
    .limit(1);

  return !!result;
}

/**
 * Check if a date range is fully available (no confirmed reservations and no blocked periods).
 */
export async function isDateRangeAvailable(
  arrivalDate: Date,
  departureDate: Date
): Promise<{ available: boolean; reason?: string }> {
  const reservationOverlap = await hasReservationOverlap(
    arrivalDate,
    departureDate
  );
  if (reservationOverlap) {
    return {
      available: false,
      reason: "Er is al een bevestigde reservering in deze periode.",
    };
  }

  const blockedOverlap = await hasBlockedPeriodOverlap(
    arrivalDate,
    departureDate
  );
  if (blockedOverlap) {
    return {
      available: false,
      reason: "De gekozen periode is niet beschikbaar.",
    };
  }

  return { available: true };
}
