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

  console.log("Seed complete:");
  console.log("  User: admin@orvelterhof.nl / admin123");
  console.log(`  Reservations: ${reservations.length} records`);
  console.log(`  Cost items: ${costItemsData.length} records`);
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
