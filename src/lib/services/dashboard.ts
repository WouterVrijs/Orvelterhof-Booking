import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";

export type DashboardStats = {
  newRequests: number;
  confirmed: number;
  upcomingArrivals: number;
  upcomingDepartures: number;
};

export type UpcomingReservation = {
  id: string;
  reservationNumber: string;
  firstName: string;
  lastName: string;
  arrivalDate: string;
  departureDate: string;
  numberOfGuests: number;
  status: string;
};

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function daysFromNowISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [newResult] = await db
    .select({ value: count() })
    .from(reservations)
    .where(eq(reservations.status, "NEW"));

  const [confirmedResult] = await db
    .select({ value: count() })
    .from(reservations)
    .where(eq(reservations.status, "CONFIRMED"));

  const today = todayISO();
  const weekFromNow = daysFromNowISO(7);

  const [arrivalsResult] = await db
    .select({ value: count() })
    .from(reservations)
    .where(
      and(
        eq(reservations.status, "CONFIRMED"),
        gte(reservations.arrivalDate, today),
        lte(reservations.arrivalDate, weekFromNow)
      )
    );

  const [departuresResult] = await db
    .select({ value: count() })
    .from(reservations)
    .where(
      and(
        eq(reservations.status, "CONFIRMED"),
        gte(reservations.departureDate, today),
        lte(reservations.departureDate, weekFromNow)
      )
    );

  return {
    newRequests: newResult.value,
    confirmed: confirmedResult.value,
    upcomingArrivals: arrivalsResult.value,
    upcomingDepartures: departuresResult.value,
  };
}

export async function getUpcomingArrivals(
  limit = 5
): Promise<UpcomingReservation[]> {
  const today = todayISO();
  const weekFromNow = daysFromNowISO(7);

  const rows = await db
    .select({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
      firstName: reservations.firstName,
      lastName: reservations.lastName,
      arrivalDate: reservations.arrivalDate,
      departureDate: reservations.departureDate,
      numberOfGuests: reservations.numberOfGuests,
      status: reservations.status,
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.status, "CONFIRMED"),
        gte(reservations.arrivalDate, today),
        lte(reservations.arrivalDate, weekFromNow)
      )
    )
    .orderBy(sql`${reservations.arrivalDate} asc`)
    .limit(limit);

  return rows;
}

export async function getUpcomingDepartures(
  limit = 5
): Promise<UpcomingReservation[]> {
  const today = todayISO();
  const weekFromNow = daysFromNowISO(7);

  const rows = await db
    .select({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
      firstName: reservations.firstName,
      lastName: reservations.lastName,
      arrivalDate: reservations.arrivalDate,
      departureDate: reservations.departureDate,
      numberOfGuests: reservations.numberOfGuests,
      status: reservations.status,
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.status, "CONFIRMED"),
        gte(reservations.departureDate, today),
        lte(reservations.departureDate, weekFromNow)
      )
    )
    .orderBy(sql`${reservations.departureDate} asc`)
    .limit(limit);

  return rows;
}
