import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isDateRangeAvailable } from "@/lib/services/availability";
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

  // 4. Create reservation
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
      source: "WEBSITE",
      status: "NEW",
    })
    .returning({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
    });

  // 5. TODO (Epic e-mails): trigger email workflows
  // - Bevestigingsmail naar gast
  // - Notificatiemail naar beheerder
  console.log(
    `[booking-intake] New booking request ${reservationNumber} from ${data.email}`
  );

  return {
    success: true,
    reservationId: created.id,
    reservationNumber: created.reservationNumber,
  };
}
