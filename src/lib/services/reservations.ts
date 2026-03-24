import { db } from "@/lib/db";
import { reservations, type Reservation } from "@/lib/db/schema";
import { eq, or, ilike, sql, and, desc, asc } from "drizzle-orm";
import type { ReservationStatus } from "@/lib/types";

export type ReservationListItem = Pick<
  Reservation,
  | "id"
  | "reservationNumber"
  | "firstName"
  | "lastName"
  | "email"
  | "arrivalDate"
  | "departureDate"
  | "numberOfGuests"
  | "status"
  | "source"
  | "totalPrice"
  | "paymentStatus"
  | "createdAt"
>;

export type SortField = "arrivalDate" | "departureDate" | "createdAt";
export type SortOrder = "asc" | "desc";

export type ReservationFilters = {
  status?: ReservationStatus | null;
  search?: string | null;
  sortBy?: SortField;
  sortOrder?: SortOrder;
};

const SORT_COLUMNS = {
  arrivalDate: reservations.arrivalDate,
  departureDate: reservations.departureDate,
  createdAt: reservations.createdAt,
} as const;

export async function getReservations(
  filters: ReservationFilters = {}
): Promise<ReservationListItem[]> {
  const { status, search, sortBy = "createdAt", sortOrder = "desc" } = filters;

  const conditions = [];

  // Status filter
  if (status) {
    conditions.push(eq(reservations.status, status));
  }

  // Search across name, email, reservation number
  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(reservations.firstName, term),
        ilike(reservations.lastName, term),
        ilike(reservations.email, term),
        ilike(reservations.reservationNumber, term),
        // Also search full name (first + last)
        sql`concat(${reservations.firstName}, ' ', ${reservations.lastName}) ilike ${term}`
      )
    );
  }

  const sortColumn = SORT_COLUMNS[sortBy] ?? SORT_COLUMNS.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  const rows = await db
    .select({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
      firstName: reservations.firstName,
      lastName: reservations.lastName,
      email: reservations.email,
      arrivalDate: reservations.arrivalDate,
      departureDate: reservations.departureDate,
      numberOfGuests: reservations.numberOfGuests,
      status: reservations.status,
      source: reservations.source,
      totalPrice: reservations.totalPrice,
      paymentStatus: reservations.paymentStatus,
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderFn(sortColumn));

  return rows;
}
