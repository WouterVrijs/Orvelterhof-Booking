"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { logAudit } from "@/lib/services/audit";
import { z } from "zod";

export type DepositActionState = {
  message?: string;
  success?: boolean;
} | null;

// --- Register deposit received ---

const registerDepositSchema = z.object({
  reservationId: z.string().uuid(),
  amount: z.coerce.number().positive("Bedrag moet groter dan 0 zijn"),
  method: z.enum(["BANK_TRANSFER", "CASH", "IDEAL", "CREDITCARD", "MOLLIE", "OTHER"]),
  receivedAt: z.string().min(1, "Datum is verplicht"),
});

export async function registerDepositAction(
  _prevState: DepositActionState,
  formData: FormData
): Promise<DepositActionState> {
  const raw = {
    reservationId: formData.get("reservationId") as string,
    amount: formData.get("amount") as string,
    method: formData.get("method") as string,
    receivedAt: formData.get("receivedAt") as string,
  };

  const result = registerDepositSchema.safeParse(raw);
  if (!result.success) {
    return { message: Object.values(result.error.flatten().fieldErrors).flat()[0] };
  }

  const { reservationId, amount, receivedAt } = result.data;

  await db
    .update(reservations)
    .set({
      depositAmount: amount.toFixed(2),
      depositStatus: "RECEIVED",
      depositReceivedAt: receivedAt,
    })
    .where(eq(reservations.id, reservationId));

  await logAudit({
    action: "payment.registered",
    entityType: "reservation",
    entityId: reservationId,
    description: `Borgsom van €${amount.toFixed(2)} ontvangen`,
    metadata: { amount, method: result.data.method, receivedAt },
  });

  revalidatePath(`/reservations/${reservationId}`);
  return { success: true };
}

// --- Return deposit ---

const returnDepositSchema = z.object({
  reservationId: z.string().uuid(),
  returnedAmount: z.coerce.number().min(0, "Bedrag mag niet negatief zijn"),
  returnedAt: z.string().min(1, "Datum is verplicht"),
  retentionReason: z.string().optional(),
});

export async function returnDepositAction(
  _prevState: DepositActionState,
  formData: FormData
): Promise<DepositActionState> {
  const raw = {
    reservationId: formData.get("reservationId") as string,
    returnedAmount: formData.get("returnedAmount") as string,
    returnedAt: formData.get("returnedAt") as string,
    retentionReason: (formData.get("retentionReason") as string) || undefined,
  };

  const result = returnDepositSchema.safeParse(raw);
  if (!result.success) {
    return { message: Object.values(result.error.flatten().fieldErrors).flat()[0] };
  }

  const { reservationId, returnedAmount, returnedAt, retentionReason } = result.data;

  // Get original deposit amount
  const [reservation] = await db
    .select({ depositAmount: reservations.depositAmount })
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1);

  if (!reservation) return { message: "Reservering niet gevonden" };

  const originalAmount = parseFloat(reservation.depositAmount);
  let status: string;

  if (returnedAmount <= 0) {
    status = "RETAINED";
  } else if (returnedAmount >= originalAmount) {
    status = "RETURNED";
  } else {
    status = "PARTIAL_RETURN";
  }

  await db
    .update(reservations)
    .set({
      depositStatus: status,
      depositReturnedAt: returnedAt,
      depositReturnedAmount: returnedAmount.toFixed(2),
      depositRetentionReason: retentionReason || null,
    })
    .where(eq(reservations.id, reservationId));

  await logAudit({
    action: "payment.registered",
    entityType: "reservation",
    entityId: reservationId,
    description: returnedAmount > 0
      ? `Borgsom van €${returnedAmount.toFixed(2)} terugbetaald${retentionReason ? ` (${retentionReason})` : ""}`
      : `Borgsom ingehouden: ${retentionReason || "geen reden opgegeven"}`,
    metadata: { returnedAmount, retentionReason, status },
  });

  revalidatePath(`/reservations/${reservationId}`);
  return { success: true };
}

// --- Get outstanding deposits ---

export async function getOutstandingDeposits() {
  return db
    .select({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
      firstName: reservations.firstName,
      lastName: reservations.lastName,
      arrivalDate: reservations.arrivalDate,
      departureDate: reservations.departureDate,
      depositAmount: reservations.depositAmount,
      depositStatus: reservations.depositStatus,
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.depositStatus, "RECEIVED"),
        ne(reservations.status, "CANCELLED")
      )
    )
    .orderBy(reservations.departureDate);
}
