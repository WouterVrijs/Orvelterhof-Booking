"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { payments, reservations } from "@/lib/db/schema";
import { eq, sum, desc, and, ne } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/services/audit";
import type { PaymentStatus } from "@/lib/types";

export type PaymentActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

// --- Register payment ---

const registerPaymentSchema = z.object({
  reservationId: z.string().uuid(),
  amount: z.coerce.number().positive("Bedrag moet groter dan 0 zijn"),
  method: z.enum(["BANK_TRANSFER", "CASH", "IDEAL", "CREDITCARD", "MOLLIE", "OTHER"]),
  description: z.string().optional(),
  paidAt: z.string().min(1, "Datum is verplicht"),
});

export async function registerPaymentAction(
  _prevState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const raw = {
    reservationId: formData.get("reservationId") as string,
    amount: formData.get("amount") as string,
    method: formData.get("method") as string,
    description: (formData.get("description") as string) || undefined,
    paidAt: formData.get("paidAt") as string,
  };

  const result = registerPaymentSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { reservationId, amount, method, description, paidAt } = result.data;

  // Verify reservation exists
  const [reservation] = await db
    .select({
      id: reservations.id,
      totalPrice: reservations.totalPrice,
      reservationNumber: reservations.reservationNumber,
    })
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1);

  if (!reservation) {
    return { message: "Reservering niet gevonden" };
  }

  // Insert payment
  await db.insert(payments).values({
    reservationId,
    amount: amount.toFixed(2),
    method,
    description: description || null,
    paidAt,
  });

  // Recalculate payment status
  await recalculatePaymentStatus(reservationId);

  await logAudit({
    action: "payment.registered",
    entityType: "reservation",
    entityId: reservationId,
    description: `Betaling van €${amount.toFixed(2)} geregistreerd (${method})`,
    metadata: { amount, method, paidAt },
  });

  revalidatePath(`/reservations/${reservationId}`);
  revalidatePath("/reservations");
  return { success: true };
}

// --- Delete payment ---

export async function deletePaymentAction(
  paymentId: string,
  reservationId: string
): Promise<PaymentActionState> {
  await db.delete(payments).where(eq(payments.id, paymentId));
  await recalculatePaymentStatus(reservationId);

  await logAudit({
    action: "payment.deleted",
    entityType: "reservation",
    entityId: reservationId,
    description: "Betaling verwijderd",
  });

  revalidatePath(`/reservations/${reservationId}`);
  revalidatePath("/reservations");
  return { success: true };
}

// --- Get payments for a reservation ---

export async function getPaymentsForReservation(reservationId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.reservationId, reservationId))
    .orderBy(desc(payments.paidAt));
}

// --- Get outstanding payments across all reservations ---

export async function getOutstandingReservations() {
  return db
    .select({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
      firstName: reservations.firstName,
      lastName: reservations.lastName,
      arrivalDate: reservations.arrivalDate,
      departureDate: reservations.departureDate,
      totalPrice: reservations.totalPrice,
      amountPaid: reservations.amountPaid,
      paymentStatus: reservations.paymentStatus,
      status: reservations.status,
    })
    .from(reservations)
    .where(
      and(
        ne(reservations.paymentStatus, "PAID"),
        ne(reservations.paymentStatus, "REFUNDED"),
        ne(reservations.status, "CANCELLED")
      )
    )
    .orderBy(reservations.arrivalDate);
}

// --- Recalculate payment status based on total payments ---

async function recalculatePaymentStatus(reservationId: string) {
  const [{ total }] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.reservationId, reservationId));

  const totalPaid = parseFloat(total || "0");

  const [reservation] = await db
    .select({ totalPrice: reservations.totalPrice })
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1);

  const totalPrice = parseFloat(reservation?.totalPrice || "0");

  let paymentStatus: PaymentStatus;
  if (totalPaid <= 0) {
    paymentStatus = "UNPAID";
  } else if (totalPaid >= totalPrice && totalPrice > 0) {
    paymentStatus = "PAID";
  } else {
    paymentStatus = "PARTIAL";
  }

  await db
    .update(reservations)
    .set({
      paymentStatus,
      amountPaid: totalPaid.toFixed(2),
    })
    .where(eq(reservations.id, reservationId));
}
