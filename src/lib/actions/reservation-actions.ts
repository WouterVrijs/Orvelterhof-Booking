"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { and, eq, lt, gt, ne } from "drizzle-orm";
import { createReservationSchema } from "@/lib/validations/reservation";
import { generateReservationNumber } from "@/lib/utils/reservation-number";
import { formatDateISO } from "@/lib/utils/dates";
import { z } from "zod";

// --- Shared types ---

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

// --- Overlap check ---

async function hasOverlap(
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

// --- Create ---

export async function createReservationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    arrivalDate: formData.get("arrivalDate") as string,
    departureDate: formData.get("departureDate") as string,
    numberOfGuests: formData.get("numberOfGuests") as string,
    guestNote: (formData.get("guestNote") as string) || undefined,
    internalNote: (formData.get("internalNote") as string) || undefined,
    source: (formData.get("source") as string) || "MANUAL",
  };

  const result = createReservationSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  const overlap = await hasOverlap(data.arrivalDate, data.departureDate);
  if (overlap) {
    return {
      message:
        "Er is al een bevestigde reservering in deze periode. Kies andere datums.",
    };
  }

  let reservationNumber = generateReservationNumber();
  for (let attempt = 0; attempt < 5; attempt++) {
    const [existing] = await db
      .select({ id: reservations.id })
      .from(reservations)
      .where(eq(reservations.reservationNumber, reservationNumber))
      .limit(1);

    if (!existing) break;
    reservationNumber = generateReservationNumber();
  }

  const [created] = await db
    .insert(reservations)
    .values({
      reservationNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      arrivalDate: formatDateISO(data.arrivalDate),
      departureDate: formatDateISO(data.departureDate),
      numberOfGuests: data.numberOfGuests,
      guestNote: data.guestNote || null,
      internalNote: data.internalNote || null,
      source: data.source,
      status: "NEW",
    })
    .returning({ id: reservations.id });

  redirect(`/reservations/${created.id}`);
}

// --- Update ---

const updateReservationSchema = z
  .object({
    id: z.string().uuid(),
    firstName: z.string().min(1, "Voornaam is verplicht"),
    lastName: z.string().min(1, "Achternaam is verplicht"),
    email: z.string().email("Ongeldig e-mailadres"),
    phone: z.string().optional(),
    arrivalDate: z.coerce.date({ error: "Aankomstdatum is verplicht" }),
    departureDate: z.coerce.date({ error: "Vertrekdatum is verplicht" }),
    numberOfGuests: z.coerce.number().int().min(1, "Minimaal 1 gast"),
    guestNote: z.string().optional(),
    internalNote: z.string().optional(),
  })
  .refine((data) => data.departureDate > data.arrivalDate, {
    message: "Vertrekdatum moet na aankomstdatum liggen",
    path: ["departureDate"],
  });

export async function updateReservationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    id: formData.get("id") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    arrivalDate: formData.get("arrivalDate") as string,
    departureDate: formData.get("departureDate") as string,
    numberOfGuests: formData.get("numberOfGuests") as string,
    guestNote: (formData.get("guestNote") as string) || undefined,
    internalNote: (formData.get("internalNote") as string) || undefined,
  };

  const result = updateReservationSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  // Verify reservation exists
  const [existing] = await db
    .select({ id: reservations.id, status: reservations.status })
    .from(reservations)
    .where(eq(reservations.id, data.id))
    .limit(1);

  if (!existing) {
    return { message: "Reservering niet gevonden" };
  }

  // Overlap check (exclude self) — only relevant if reservation is confirmed
  if (existing.status === "CONFIRMED") {
    const overlap = await hasOverlap(
      data.arrivalDate,
      data.departureDate,
      data.id
    );
    if (overlap) {
      return {
        message:
          "Er is al een bevestigde reservering in deze periode. Kies andere datums.",
      };
    }
  }

  await db
    .update(reservations)
    .set({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      arrivalDate: formatDateISO(data.arrivalDate),
      departureDate: formatDateISO(data.departureDate),
      numberOfGuests: data.numberOfGuests,
      guestNote: data.guestNote || null,
      internalNote: data.internalNote || null,
    })
    .where(eq(reservations.id, data.id));

  revalidatePath(`/reservations/${data.id}`);
  return { success: true };
}
