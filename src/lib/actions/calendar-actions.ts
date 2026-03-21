"use server";

import { db } from "@/lib/db";
import { reservations, blockedPeriods } from "@/lib/db/schema";
import { and, lt, gt, inArray } from "drizzle-orm";

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  status: "available" | "confirmed" | "pending" | "blocked";
}

/**
 * Get availability data for a month range.
 * Returns all days with their status for the datepicker to render.
 */
export async function getMonthAvailability(
  from: string,
  to: string
): Promise<{
  confirmedRanges: { start: string; end: string }[];
  pendingRanges: { start: string; end: string }[];
  blockedRanges: { start: string; end: string }[];
}> {
  const [confirmed, pending, blocks] = await Promise.all([
    db
      .select({
        start: reservations.arrivalDate,
        end: reservations.departureDate,
      })
      .from(reservations)
      .where(
        and(
          inArray(reservations.status, ["CONFIRMED"]),
          lt(reservations.arrivalDate, to),
          gt(reservations.departureDate, from)
        )
      ),
    db
      .select({
        start: reservations.arrivalDate,
        end: reservations.departureDate,
      })
      .from(reservations)
      .where(
        and(
          inArray(reservations.status, ["NEW", "IN_PROGRESS"]),
          lt(reservations.arrivalDate, to),
          gt(reservations.departureDate, from)
        )
      ),
    db
      .select({
        start: blockedPeriods.startDate,
        end: blockedPeriods.endDate,
      })
      .from(blockedPeriods)
      .where(
        and(
          lt(blockedPeriods.startDate, to),
          gt(blockedPeriods.endDate, from)
        )
      ),
  ]);

  return {
    confirmedRanges: confirmed.map((r) => ({ start: r.start, end: r.end })),
    pendingRanges: pending.map((r) => ({ start: r.start, end: r.end })),
    blockedRanges: blocks.map((b) => ({ start: b.start, end: b.end })),
  };
}
