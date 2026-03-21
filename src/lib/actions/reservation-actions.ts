"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { and, eq, lt, gt, ne } from "drizzle-orm";
import { createReservationSchema } from "@/lib/validations/reservation";
import { generateReservationNumber } from "@/lib/utils/reservation-number";
import { formatDateISO } from "@/lib/utils/dates";
import { hasReservationOverlap } from "@/lib/services/availability";
import { calculatePrice } from "@/lib/services/pricing";
import { logAudit } from "@/lib/services/audit";
import {
  sendMail,
  buildConfirmationEmail,
  buildCancellationEmail,
} from "@/lib/services/mail";
import { ALLOWED_TRANSITIONS, type ReservationStatus } from "@/lib/types";
import { z } from "zod";

// --- Shared types ---

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

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

  const overlap = await hasReservationOverlap(data.arrivalDate, data.departureDate);
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

  // Calculate total price based on pricing settings
  const price = await calculatePrice(data.arrivalDate, data.departureDate);

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
      totalPrice: price.totalPrice.toFixed(2),
      guestNote: data.guestNote || null,
      internalNote: data.internalNote || null,
      source: data.source,
      status: "NEW",
    })
    .returning({ id: reservations.id });

  await logAudit({
    action: "reservation.created",
    entityType: "reservation",
    entityId: created.id,
    description: `Reservering ${reservationNumber} aangemaakt voor ${data.firstName} ${data.lastName}`,
    metadata: { source: data.source, arrivalDate: formatDateISO(data.arrivalDate), departureDate: formatDateISO(data.departureDate) },
  });

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
    const overlap = await hasReservationOverlap(
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

// --- Update status ---

export async function updateReservationStatusAction(
  reservationId: string,
  newStatus: ReservationStatus
): Promise<ActionState> {
  // Verify reservation exists — fetch full details for email
  const [existing] = await db
    .select({
      id: reservations.id,
      status: reservations.status,
      reservationNumber: reservations.reservationNumber,
      firstName: reservations.firstName,
      email: reservations.email,
      arrivalDate: reservations.arrivalDate,
      departureDate: reservations.departureDate,
      numberOfGuests: reservations.numberOfGuests,
    })
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1);

  if (!existing) {
    return { message: "Reservering niet gevonden" };
  }

  const currentStatus = existing.status as ReservationStatus;

  // Validate transition
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed.includes(newStatus)) {
    return {
      message: `Status kan niet worden gewijzigd van "${currentStatus}" naar "${newStatus}"`,
    };
  }

  // If confirming, check for overlapping confirmed reservations
  if (newStatus === "CONFIRMED") {
    const overlap = await hasReservationOverlap(
      new Date(existing.arrivalDate),
      new Date(existing.departureDate)
    );
    if (overlap) {
      return {
        message:
          "Kan niet bevestigen: er is al een bevestigde reservering in deze periode.",
      };
    }
  }

  await db
    .update(reservations)
    .set({
      status: newStatus,
      statusChangedAt: new Date(),
    })
    .where(eq(reservations.id, reservationId));

  // Send confirmation email to guest
  if (newStatus === "CONFIRMED") {
    const email = buildConfirmationEmail({
      firstName: existing.firstName,
      reservationNumber: existing.reservationNumber,
      arrivalDate: existing.arrivalDate,
      departureDate: existing.departureDate,
      numberOfGuests: existing.numberOfGuests,
    });
    await sendMail({ to: existing.email, ...email }).catch((err) =>
      console.error("[reservation] Failed to send confirmation email:", err)
    );
  }

  await logAudit({
    action: newStatus === "CONFIRMED" ? "reservation.confirmed" : "reservation.status_changed",
    entityType: "reservation",
    entityId: reservationId,
    description: `Status gewijzigd van ${currentStatus} naar ${newStatus}`,
    metadata: { from: currentStatus, to: newStatus },
  });

  revalidatePath(`/reservations/${reservationId}`);
  revalidatePath("/reservations");
  revalidatePath("/calendar");
  return { success: true };
}

// --- Cancel with reason ---

export async function cancelReservationAction(
  reservationId: string,
  reason?: string
): Promise<ActionState> {
  const [existing] = await db
    .select({
      id: reservations.id,
      status: reservations.status,
      reservationNumber: reservations.reservationNumber,
      firstName: reservations.firstName,
      email: reservations.email,
      arrivalDate: reservations.arrivalDate,
      departureDate: reservations.departureDate,
    })
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1);

  if (!existing) {
    return { message: "Reservering niet gevonden" };
  }

  const currentStatus = existing.status as ReservationStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowed.includes("CANCELLED")) {
    return {
      message: `Reservering met status "${currentStatus}" kan niet worden geannuleerd`,
    };
  }

  await db
    .update(reservations)
    .set({
      status: "CANCELLED",
      statusChangedAt: new Date(),
      // Store cancellation reason in internal note (append if existing)
      ...(reason && {
        internalNote: existing.status === "CONFIRMED"
          ? `[Geannuleerd] ${reason}`
          : reason,
      }),
    })
    .where(eq(reservations.id, reservationId));

  // Send cancellation email to guest
  const cancelEmail = buildCancellationEmail({
    firstName: existing.firstName,
    reservationNumber: existing.reservationNumber,
    arrivalDate: existing.arrivalDate,
    departureDate: existing.departureDate,
  });
  await sendMail({ to: existing.email, ...cancelEmail }).catch((err) =>
    console.error("[reservation] Failed to send cancellation email:", err)
  );

  await logAudit({
    action: "reservation.cancelled",
    entityType: "reservation",
    entityId: reservationId,
    description: `Reservering geannuleerd${reason ? `: ${reason}` : ""}`,
    metadata: { previousStatus: currentStatus, reason: reason || null },
  });

  revalidatePath(`/reservations/${reservationId}`);
  revalidatePath("/reservations");
  revalidatePath("/calendar");
  return { success: true };
}
