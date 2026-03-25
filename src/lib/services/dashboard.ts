import { db } from "@/lib/db";
import { reservations, invoices } from "@/lib/db/schema";
import { eq, and, gte, lte, or, ne, count, sum, sql } from "drizzle-orm";

// --- Types ---

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

export type ActionItem = {
  type: "review" | "payment" | "arrival_today" | "departure_today" | "arrival_tomorrow";
  label: string;
  count: number;
  href: string;
};

export type Notification = {
  type: "info" | "warning" | "urgent";
  message: string;
  href?: string;
};

// --- Helpers ---

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function daysFromNowISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// --- Stats ---

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = todayISO();
  const weekFromNow = daysFromNowISO(7);

  const [newResult, confirmedResult, arrivalsResult, departuresResult] =
    await Promise.all([
      db.select({ value: count() }).from(reservations).where(eq(reservations.status, "NEW")),
      db.select({ value: count() }).from(reservations).where(eq(reservations.status, "CONFIRMED")),
      db.select({ value: count() }).from(reservations).where(
        and(eq(reservations.status, "CONFIRMED"), gte(reservations.arrivalDate, today), lte(reservations.arrivalDate, weekFromNow))
      ),
      db.select({ value: count() }).from(reservations).where(
        and(eq(reservations.status, "CONFIRMED"), gte(reservations.departureDate, today), lte(reservations.departureDate, weekFromNow))
      ),
    ]);

  return {
    newRequests: newResult[0].value,
    confirmed: confirmedResult[0].value,
    upcomingArrivals: arrivalsResult[0].value,
    upcomingDepartures: departuresResult[0].value,
  };
}

// --- Upcoming lists ---

export async function getUpcomingArrivals(limit = 5): Promise<UpcomingReservation[]> {
  const today = todayISO();
  const weekFromNow = daysFromNowISO(7);

  return db
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
    .where(and(eq(reservations.status, "CONFIRMED"), gte(reservations.arrivalDate, today), lte(reservations.arrivalDate, weekFromNow)))
    .orderBy(sql`${reservations.arrivalDate} asc`)
    .limit(limit);
}

export async function getUpcomingDepartures(limit = 5): Promise<UpcomingReservation[]> {
  const today = todayISO();
  const weekFromNow = daysFromNowISO(7);

  return db
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
    .where(and(eq(reservations.status, "CONFIRMED"), gte(reservations.departureDate, today), lte(reservations.departureDate, weekFromNow)))
    .orderBy(sql`${reservations.departureDate} asc`)
    .limit(limit);
}

// --- Action items (Epic 4b) ---

export async function getActionItems(): Promise<ActionItem[]> {
  const today = todayISO();
  const tomorrow = daysFromNowISO(1);
  const items: ActionItem[] = [];

  // Reservations needing review (NEW or IN_PROGRESS)
  const [reviewResult] = await db
    .select({ value: count() })
    .from(reservations)
    .where(or(eq(reservations.status, "NEW"), eq(reservations.status, "IN_PROGRESS")));

  if (reviewResult.value > 0) {
    items.push({
      type: "review",
      label: "Aanvragen te beoordelen",
      count: reviewResult.value,
      href: "/reservations?status=NEW",
    });
  }

  // Outstanding payments
  const [paymentResult] = await db
    .select({ value: count() })
    .from(reservations)
    .where(
      and(
        or(eq(reservations.paymentStatus, "UNPAID"), eq(reservations.paymentStatus, "PARTIAL")),
        ne(reservations.status, "CANCELLED")
      )
    );

  if (paymentResult.value > 0) {
    items.push({
      type: "payment",
      label: "Openstaande betalingen",
      count: paymentResult.value,
      href: "/reservations",
    });
  }

  // Arrivals today
  const [arrivalsTodayResult] = await db
    .select({ value: count() })
    .from(reservations)
    .where(and(eq(reservations.status, "CONFIRMED"), eq(reservations.arrivalDate, today)));

  if (arrivalsTodayResult.value > 0) {
    items.push({
      type: "arrival_today",
      label: "Aankomsten vandaag",
      count: arrivalsTodayResult.value,
      href: "/reservations",
    });
  }

  // Departures today
  const [departuresTodayResult] = await db
    .select({ value: count() })
    .from(reservations)
    .where(and(eq(reservations.status, "CONFIRMED"), eq(reservations.departureDate, today)));

  if (departuresTodayResult.value > 0) {
    items.push({
      type: "departure_today",
      label: "Vertrekken vandaag",
      count: departuresTodayResult.value,
      href: "/reservations",
    });
  }

  // Arrivals tomorrow
  const [arrivalsTomorrowResult] = await db
    .select({ value: count() })
    .from(reservations)
    .where(and(eq(reservations.status, "CONFIRMED"), eq(reservations.arrivalDate, tomorrow)));

  if (arrivalsTomorrowResult.value > 0) {
    items.push({
      type: "arrival_tomorrow",
      label: "Aankomsten morgen",
      count: arrivalsTomorrowResult.value,
      href: "/reservations",
    });
  }

  return items;
}

// --- Notifications (Epic 4b) ---

export async function getNotifications(): Promise<Notification[]> {
  const today = todayISO();
  const tomorrow = daysFromNowISO(1);
  const notifications: Notification[] = [];

  // Arrivals tomorrow — specific guest names
  const tomorrowArrivals = await db
    .select({ firstName: reservations.firstName, lastName: reservations.lastName, id: reservations.id })
    .from(reservations)
    .where(and(eq(reservations.status, "CONFIRMED"), eq(reservations.arrivalDate, tomorrow)))
    .limit(3);

  for (const a of tomorrowArrivals) {
    notifications.push({
      type: "info",
      message: `Aankomst morgen: ${a.firstName} ${a.lastName}`,
      href: `/reservations/${a.id}`,
    });
  }

  // Outstanding payments with guest names
  const unpaid = await db
    .select({ firstName: reservations.firstName, lastName: reservations.lastName, id: reservations.id })
    .from(reservations)
    .where(
      and(
        eq(reservations.paymentStatus, "UNPAID"),
        eq(reservations.status, "CONFIRMED")
      )
    )
    .limit(3);

  for (const u of unpaid) {
    notifications.push({
      type: "warning",
      message: `Openstaande betaling: ${u.firstName} ${u.lastName}`,
      href: `/reservations/${u.id}`,
    });
  }

  // New requests
  const [newCount] = await db
    .select({ value: count() })
    .from(reservations)
    .where(eq(reservations.status, "NEW"));

  if (newCount.value > 0) {
    notifications.push({
      type: "urgent",
      message: `${newCount.value} nieuwe aanvra${newCount.value === 1 ? "ag" : "gen"} ontvangen`,
      href: "/reservations?status=NEW",
    });
  }

  // Draft invoices
  const [draftInvoices] = await db
    .select({ value: count() })
    .from(invoices)
    .where(eq(invoices.status, "DRAFT"));

  if (draftInvoices.value > 0) {
    notifications.push({
      type: "info",
      message: `${draftInvoices.value} factuur/facturen nog niet verstuurd`,
    });
  }

  return notifications;
}

// --- Today arrivals/departures (Epic 4c) ---

export async function getTodayArrivals(): Promise<UpcomingReservation[]> {
  const today = todayISO();
  return db
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
    .where(and(eq(reservations.status, "CONFIRMED"), eq(reservations.arrivalDate, today)))
    .orderBy(sql`${reservations.arrivalDate} asc`);
}

export async function getTodayDepartures(): Promise<UpcomingReservation[]> {
  const today = todayISO();
  return db
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
    .where(and(eq(reservations.status, "CONFIRMED"), eq(reservations.departureDate, today)))
    .orderBy(sql`${reservations.departureDate} asc`);
}

// --- Week summary ---

export type WeekSummary = {
  todayArrivals: number;
  todayDepartures: number;
  weekArrivals: number;
  weekDepartures: number;
  totalGuestsThisWeek: number;
};

export async function getWeekSummary(): Promise<WeekSummary> {
  const today = todayISO();
  const weekFromNow = daysFromNowISO(7);

  const [todayArr, todayDep, weekArr, weekDep, guestsResult] = await Promise.all([
    db.select({ value: count() }).from(reservations).where(
      and(eq(reservations.status, "CONFIRMED"), eq(reservations.arrivalDate, today))
    ),
    db.select({ value: count() }).from(reservations).where(
      and(eq(reservations.status, "CONFIRMED"), eq(reservations.departureDate, today))
    ),
    db.select({ value: count() }).from(reservations).where(
      and(eq(reservations.status, "CONFIRMED"), gte(reservations.arrivalDate, today), lte(reservations.arrivalDate, weekFromNow))
    ),
    db.select({ value: count() }).from(reservations).where(
      and(eq(reservations.status, "CONFIRMED"), gte(reservations.departureDate, today), lte(reservations.departureDate, weekFromNow))
    ),
    db.select({ value: sum(reservations.numberOfGuests) }).from(reservations).where(
      and(eq(reservations.status, "CONFIRMED"), gte(reservations.arrivalDate, today), lte(reservations.arrivalDate, weekFromNow))
    ),
  ]);

  return {
    todayArrivals: todayArr[0].value,
    todayDepartures: todayDep[0].value,
    weekArrivals: weekArr[0].value,
    weekDepartures: weekDep[0].value,
    totalGuestsThisWeek: Number(guestsResult[0].value || 0),
  };
}

// --- Current occupancy ---

export type OccupancyInfo = {
  isOccupied: boolean;
  guestName?: string;
  departureDate?: string;
  numberOfGuests?: number;
};

export async function getCurrentOccupancy(): Promise<OccupancyInfo> {
  const today = todayISO();

  const [current] = await db
    .select({
      firstName: reservations.firstName,
      lastName: reservations.lastName,
      departureDate: reservations.departureDate,
      numberOfGuests: reservations.numberOfGuests,
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.status, "CONFIRMED"),
        lte(reservations.arrivalDate, today),
        gte(reservations.departureDate, today)
      )
    )
    .limit(1);

  if (!current) {
    return { isOccupied: false };
  }

  return {
    isOccupied: true,
    guestName: `${current.firstName} ${current.lastName}`,
    departureDate: current.departureDate,
    numberOfGuests: current.numberOfGuests,
  };
}

// --- Recent requests ---

export type RecentRequest = {
  id: string;
  reservationNumber: string;
  firstName: string;
  lastName: string;
  arrivalDate: string;
  departureDate: string;
  numberOfGuests: number;
  status: string;
  source: string;
  createdAt: Date;
};

export async function getRecentRequests(limit = 5): Promise<RecentRequest[]> {
  return db
    .select({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
      firstName: reservations.firstName,
      lastName: reservations.lastName,
      arrivalDate: reservations.arrivalDate,
      departureDate: reservations.departureDate,
      numberOfGuests: reservations.numberOfGuests,
      status: reservations.status,
      source: reservations.source,
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .orderBy(sql`${reservations.createdAt} desc`)
    .limit(limit);
}
