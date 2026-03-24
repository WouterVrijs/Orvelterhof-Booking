import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, reservations } from "@/lib/db/schema";
import { eq, sum } from "drizzle-orm";
import { getMolliePayment } from "@/lib/services/mollie";
import { logAudit } from "@/lib/services/audit";
import type { PaymentStatus } from "@/lib/types";

/**
 * POST /api/webhooks/mollie
 *
 * Mollie sends a webhook with { id: "tr_xxx" } when a payment status changes.
 * We fetch the payment from Mollie, update our records, and recalculate the
 * reservation payment status.
 *
 * This endpoint is NOT authenticated via API key — Mollie doesn't send one.
 * Security is handled by fetching the payment from Mollie's API (only valid
 * payment IDs will return data).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const molliePaymentId = formData.get("id") as string;

    if (!molliePaymentId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Fetch payment details from Mollie (this validates the payment exists)
    const molliePayment = await getMolliePayment(molliePaymentId);
    const metadata = molliePayment.metadata as {
      reservationId?: string;
      reservationNumber?: string;
    } | null;

    if (!metadata?.reservationId) {
      console.warn("[webhook/mollie] Payment without reservationId metadata:", molliePaymentId);
      return NextResponse.json({ received: true });
    }

    const reservationId = metadata.reservationId;
    const mollieStatus = molliePayment.status as string;

    // Update the payment record in our database
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.molliePaymentId, molliePaymentId))
      .limit(1);

    if (mollieStatus === "paid" && !existingPayment) {
      // Payment succeeded — create a payment record
      await db.insert(payments).values({
        reservationId,
        amount: molliePayment.amount.value,
        method: "MOLLIE",
        description: `Mollie betaling ${molliePaymentId}`,
        molliePaymentId,
        mollieStatus,
        paidAt: new Date().toISOString().split("T")[0],
      });
    } else if (existingPayment) {
      // Update existing payment record with latest Mollie status
      await db
        .update(payments)
        .set({ mollieStatus })
        .where(eq(payments.id, existingPayment.id));

      // If refunded, set amount to 0
      if (mollieStatus === "refunded") {
        await db
          .update(payments)
          .set({ amount: "0.00", mollieStatus })
          .where(eq(payments.id, existingPayment.id));
      }
    }

    // Recalculate reservation payment status
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
    if (mollieStatus === "refunded") {
      paymentStatus = "REFUNDED";
    } else if (totalPaid <= 0) {
      paymentStatus = "UNPAID";
    } else if (totalPaid >= totalPrice && totalPrice > 0) {
      paymentStatus = "PAID";
    } else {
      paymentStatus = "PARTIAL";
    }

    await db
      .update(reservations)
      .set({ paymentStatus, amountPaid: totalPaid.toFixed(2) })
      .where(eq(reservations.id, reservationId));

    await logAudit({
      action: "payment.registered",
      entityType: "reservation",
      entityId: reservationId,
      description: `Mollie webhook: status=${mollieStatus}, bedrag=€${molliePayment.amount.value}`,
      metadata: { molliePaymentId, mollieStatus },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook/mollie] Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
