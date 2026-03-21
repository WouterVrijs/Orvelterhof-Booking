import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  // --- User ---
  const passwordHash = await bcrypt.hash("admin123", 12);
  await db
    .insert(schema.users)
    .values({
      name: "Beheerder",
      email: "admin@orvelterhof.nl",
      passwordHash,
      isActive: true,
    })
    .onConflictDoNothing({ target: schema.users.email });

  // --- Reservations ---
  const reservations = [
    {
      reservationNumber: "ORV-20260315-A1B2",
      firstName: "Jan",
      lastName: "de Vries",
      email: "jan@voorbeeld.nl",
      phone: "06-12345678",
      arrivalDate: daysFromNow(2),
      departureDate: daysFromNow(5),
      numberOfGuests: 8,
      status: "CONFIRMED" as const,
      totalPrice: "1250.00",
      source: "WEBSITE" as const,
      guestNote: "Graag een extra kinderbed",
    },
    {
      reservationNumber: "ORV-20260316-C3D4",
      firstName: "Maria",
      lastName: "Jansen",
      email: "maria@voorbeeld.nl",
      phone: "06-98765432",
      arrivalDate: daysFromNow(4),
      departureDate: daysFromNow(7),
      numberOfGuests: 12,
      status: "NEW" as const,
      totalPrice: "1800.00",
      source: "WEBSITE" as const,
    },
    {
      reservationNumber: "ORV-20260317-E5F6",
      firstName: "Pieter",
      lastName: "Bakker",
      email: "pieter@voorbeeld.nl",
      arrivalDate: daysFromNow(10),
      departureDate: daysFromNow(14),
      numberOfGuests: 15,
      status: "CONFIRMED" as const,
      totalPrice: "2400.00",
      source: "MANUAL" as const,
      internalNote: "Bedrijfsuitje, factuur naar bedrijf",
    },
    {
      reservationNumber: "ORV-20260318-G7H8",
      firstName: "Sophie",
      lastName: "Mulder",
      email: "sophie@voorbeeld.nl",
      phone: "06-11223344",
      arrivalDate: daysFromNow(-3),
      departureDate: daysFromNow(1),
      numberOfGuests: 6,
      status: "CONFIRMED" as const,
      totalPrice: "900.00",
      source: "PHONE" as const,
    },
    {
      reservationNumber: "ORV-20260319-J9K0",
      firstName: "Thomas",
      lastName: "Visser",
      email: "thomas@voorbeeld.nl",
      arrivalDate: daysFromNow(20),
      departureDate: daysFromNow(23),
      numberOfGuests: 10,
      status: "NEW" as const,
      totalPrice: "1500.00",
      source: "EMAIL" as const,
      guestNote: "Verjaardag, mogelijkheid voor decoratie?",
    },
    {
      reservationNumber: "ORV-20260320-L1M2",
      firstName: "Emma",
      lastName: "de Boer",
      email: "emma@voorbeeld.nl",
      phone: "06-55667788",
      arrivalDate: daysFromNow(5),
      departureDate: daysFromNow(8),
      numberOfGuests: 20,
      status: "IN_PROGRESS" as const,
      totalPrice: "2100.00",
      source: "WEBSITE" as const,
    },
    {
      reservationNumber: "ORV-20260321-N3P4",
      firstName: "Lars",
      lastName: "Hendriks",
      email: "lars@voorbeeld.nl",
      arrivalDate: daysFromNow(-10),
      departureDate: daysFromNow(-7),
      numberOfGuests: 4,
      status: "CANCELLED" as const,
      totalPrice: "600.00",
      source: "WEBSITE" as const,
    },
  ];

  for (const res of reservations) {
    await db
      .insert(schema.reservations)
      .values(res)
      .onConflictDoNothing({ target: schema.reservations.reservationNumber });
  }

  // --- Cost Items ---
  const costItemsData = [
    { name: "Verblijf", type: "PER_NIGHT" as const, price: "650.00", category: "BASE" as const, sortOrder: 0 },
    { name: "Eindschoonmaak", type: "FIXED" as const, price: "425.00", category: "MANDATORY" as const, sortOrder: 1 },
    { name: "Bedlinnen", type: "PER_PERSON" as const, price: "14.50", category: "MANDATORY" as const, sortOrder: 2 },
    { name: "Energie", type: "PER_PERSON_PER_NIGHT" as const, price: "3.95", category: "MANDATORY" as const, sortOrder: 3 },
    { name: "Gem. heffingen", type: "PER_PERSON_PER_NIGHT" as const, price: "2.95", category: "MANDATORY" as const, sortOrder: 4 },
    { name: "Keukenlinnen", type: "PER_UNIT" as const, price: "5.50", category: "UPGRADE" as const, sortOrder: 10 },
    { name: "Barbecue", type: "PER_UNIT" as const, price: "35.00", category: "UPGRADE" as const, sortOrder: 11 },
    { name: "Badlinnen", type: "PER_PERSON" as const, price: "3.75", category: "UPGRADE" as const, sortOrder: 12 },
    { name: "Activiteit", type: "PER_PERSON" as const, price: "20.00", category: "UPGRADE" as const, sortOrder: 13 },
    { name: "Kinderbedden", type: "PER_UNIT" as const, price: "7.50", category: "UPGRADE" as const, sortOrder: 14 },
    { name: "Ontbijt", type: "PER_PERSON_PER_NIGHT" as const, price: "0.00", category: "UPGRADE" as const, sortOrder: 15 },
  ];

  for (const item of costItemsData) {
    await db
      .insert(schema.costItems)
      .values(item)
      .onConflictDoNothing();
  }

  // --- Seasons 2026 ---
  const seasonData = [
    // Periode 1 (laagseizoen) - two date ranges
    { year: 2026, name: "Periode 1", startDate: "2026-01-03", endDate: "2026-03-07", sortOrder: 0 },
    { year: 2026, name: "Periode 1", startDate: "2026-11-21", endDate: "2026-12-22", sortOrder: 0 },
    // Periode 2 (tussenseizoen) - two date ranges
    { year: 2026, name: "Periode 2", startDate: "2026-03-07", endDate: "2026-04-04", sortOrder: 1 },
    { year: 2026, name: "Periode 2", startDate: "2026-11-03", endDate: "2026-11-21", sortOrder: 1 },
    // Periode 3 (hoogseizoen)
    { year: 2026, name: "Periode 3", startDate: "2026-04-04", endDate: "2026-11-03", sortOrder: 2 },
  ];

  const createdSeasons: { id: string; name: string }[] = [];
  for (const s of seasonData) {
    const [created] = await db.insert(schema.seasons).values(s).returning({ id: schema.seasons.id, name: schema.seasons.name });
    createdSeasons.push(created);
  }

  // Stay type prices — use first season row per name for prices
  const stayTypePricesData: Record<string, { WEEKEND: number; LONG_WEEKEND: number; MIDWEEK: number; WEEK: number }> = {
    "Periode 1": { WEEKEND: 2850, LONG_WEEKEND: 2950, MIDWEEK: 2200, WEEK: 4200 },
    "Periode 2": { WEEKEND: 3200, LONG_WEEKEND: 3300, MIDWEEK: 2500, WEEK: 5400 },
    "Periode 3": { WEEKEND: 3300, LONG_WEEKEND: 3400, MIDWEEK: 2600, WEEK: 5800 },
  };

  const nightsMap = { WEEKEND: 2, LONG_WEEKEND: 3, MIDWEEK: 4, WEEK: 7 };
  const seenSeasonNames = new Set<string>();

  for (const cs of createdSeasons) {
    if (seenSeasonNames.has(cs.name)) continue;
    seenSeasonNames.add(cs.name);

    const prices = stayTypePricesData[cs.name];
    if (!prices) continue;

    for (const [stayType, price] of Object.entries(prices)) {
      await db.insert(schema.stayTypePrices).values({
        seasonId: cs.id,
        stayType: stayType as "WEEKEND" | "LONG_WEEKEND" | "MIDWEEK" | "WEEK",
        nights: nightsMap[stayType as keyof typeof nightsMap],
        price: price.toFixed(2),
      });
    }
  }

  // --- Special Arrangements 2026 ---
  const arrangementsData = [
    { year: 2026, name: "Pasen", startDate: "2026-04-03", endDate: "2026-04-06", isBooked: true, sortOrder: 0 },
    { year: 2026, name: "Hemelvaart", startDate: "2026-05-13", endDate: "2026-05-17", isBooked: true, sortOrder: 1 },
    { year: 2026, name: "Pinksteren", startDate: "2026-06-22", endDate: "2026-06-25", isBooked: true, sortOrder: 2 },
    { year: 2026, name: "Kerst (week)", startDate: "2026-12-21", endDate: "2026-12-28", price: "5500.00", isBooked: false, sortOrder: 3 },
    { year: 2026, name: "Kerst (weekend)", startDate: "2026-12-25", endDate: "2026-12-28", price: "3500.00", isBooked: false, sortOrder: 4 },
    { year: 2026, name: "Oud en Nieuw", startDate: "2026-12-28", endDate: "2027-01-01", price: "5500.00", isBooked: false, sortOrder: 5 },
    { year: 2026, name: "Oud en Nieuw (lang)", startDate: "2026-12-28", endDate: "2027-01-03", price: "6800.00", isBooked: false, sortOrder: 6 },
    { year: 2026, name: "Midweken vakanties", startDate: "2026-01-01", endDate: "2026-12-31", price: "2750.00", isBooked: false, sortOrder: 7 },
  ];

  for (const arr of arrangementsData) {
    await db.insert(schema.specialArrangements).values(arr).onConflictDoNothing();
  }

  console.log("Seed complete:");
  console.log("  User: admin@orvelterhof.nl / admin123");
  console.log(`  Reservations: ${reservations.length} records`);
  console.log(`  Cost items: ${costItemsData.length} records`);
  console.log(`  Seasons: ${seasonData.length} records`);
  console.log(`  Special arrangements: ${arrangementsData.length} records`);
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
