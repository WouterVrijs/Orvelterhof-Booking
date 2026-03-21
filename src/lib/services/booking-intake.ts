import { db } from "@/lib/db";
import { reservations, reservationLineItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isDateRangeAvailable } from "@/lib/services/availability";
import { logAudit } from "@/lib/services/audit";
import {
  sendMail,
  buildBookingRequestEmail,
  buildManagerNotificationEmail,
} from "@/lib/services/mail";
import { calculatePrice } from "@/lib/services/pricing";
import { generateReservationNumber } from "@/lib/utils/reservation-number";
import { formatDateISO } from "@/lib/utils/dates";

// --- Validation schema for incoming booking requests ---

export const bookingRequestSchema = z
  .object({
    firstName: z.string().min(1, "firstName is required"),
    lastName: z.string().min(1, "lastName is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    arrivalDate: z.coerce.date({ message: "arrivalDate is required" }),
    departureDate: z.coerce.date({ message: "departureDate is required" }),
    numberOfGuests: z.coerce
      .number()
      .int("numberOfGuests must be an integer")
      .min(1, "numberOfGuests must be at least 1"),
    guestNote: z.string().optional(),
    totalPrice: z.coerce.number().min(0).optional(),
    lineItems: z
      .array(
        z.object({
          costItemId: z.string().uuid().optional(),
          name: z.string().min(1),
          quantity: z.coerce.number().int().min(1).default(1),
          unitPrice: z.coerce.number().min(0),
          totalPrice: z.coerce.number().min(0),
        })
      )
      .optional(),
  })
  .refine((data) => data.departureDate > data.arrivalDate, {
    message: "departureDate must be after arrivalDate",
    path: ["departureDate"],
  });

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export type BookingIntakeResult =
  | { success: true; reservationId: string; reservationNumber: string }
  | { success: false; error: string; details?: Record<string, string[]> };

/**
 * Process an incoming booking request from the public website.
 * Validates, checks availability, creates reservation with status NEW and source WEBSITE.
 */
export async function processBookingRequest(
  input: unknown
): Promise<BookingIntakeResult> {
  // 1. Validate input
  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  // 2. Check availability (confirmed reservations + blocked periods)
  const availability = await isDateRangeAvailable(
    data.arrivalDate,
    data.departureDate
  );
  if (!availability.available) {
    return {
      success: false,
      error: availability.reason ?? "Dates not available",
    };
  }

  // 3. Generate unique reservation number
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

  // 4. Determine price — use website-provided price if available, otherwise calculate
  let finalPrice: string;
  if (data.totalPrice !== undefined && data.totalPrice > 0) {
    finalPrice = data.totalPrice.toFixed(2);
  } else {
    const price = await calculatePrice(data.arrivalDate, data.departureDate);
    finalPrice = price.totalPrice.toFixed(2);
  }

  // 5. Create reservation
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
      totalPrice: finalPrice,
      guestNote: data.guestNote || null,
      source: "WEBSITE",
      status: "NEW",
    })
    .returning({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
    });

  // 6. Save line items if provided
  if (data.lineItems && data.lineItems.length > 0) {
    await db.insert(reservationLineItems).values(
      data.lineItems.map((item) => ({
        reservationId: created.id,
        costItemId: item.costItemId || null,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: item.totalPrice.toFixed(2),
      }))
    );
  }

  await logAudit({
    action: "reservation.created",
    entityType: "reservation",
    entityId: created.id,
    description: `Boekingsaanvraag ${reservationNumber} ontvangen via website van ${data.firstName} ${data.lastName}`,
    metadata: { source: "WEBSITE", email: data.email },
  });

  // Send confirmation email to guest
  const guestEmail = buildBookingRequestEmail({
    firstName: data.firstName,
    reservationNumber,
    arrivalDate: formatDateISO(data.arrivalDate),
    departureDate: formatDateISO(data.departureDate),
    numberOfGuests: data.numberOfGuests,
  });
  await sendMail({ to: data.email, ...guestEmail }).catch((err) =>
    console.error("[booking-intake] Failed to send guest email:", err)
  );

  // Send notification to manager
  const managerEmail = process.env.EMAIL_FROM || "admin@orvelterhof.nl";
  const managerNotification = buildManagerNotificationEmail({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    reservationNumber,
    arrivalDate: formatDateISO(data.arrivalDate),
    departureDate: formatDateISO(data.departureDate),
    numberOfGuests: data.numberOfGuests,
    reservationId: created.id,
  });
  await sendMail({ to: managerEmail, ...managerNotification }).catch((err) =>
    console.error("[booking-intake] Failed to send manager email:", err)
  );

  return {
    success: true,
    reservationId: created.id,
    reservationNumber: created.reservationNumber,
  };
}
