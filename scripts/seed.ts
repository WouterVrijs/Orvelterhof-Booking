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

  console.log("Seed complete:");
  console.log("  User: admin@orvelterhof.nl / admin123");
  console.log(`  Reservations: ${reservations.length} records`);
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
