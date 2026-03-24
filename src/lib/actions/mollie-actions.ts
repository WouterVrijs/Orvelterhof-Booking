"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reservations, payments } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import {
  createMolliePayment,
  createMollieRefund,
  isMollieConfigured,
} from "@/lib/services/mollie";
import { sendMail, buildPaymentLinkEmail } from "@/lib/services/mail";
import { logAudit } from "@/lib/services/audit";

export type MollieActionState = {
  message?: string;
  success?: boolean;
  checkoutUrl?: string;
} | null;

// --- Create payment link ---

export async function createPaymentLinkAction(
  reservationId: string,
  amount: number
): Promise<MollieActionState> {
  if (!isMollieConfigured()) {
    return { message: "Mollie is niet geconfigureerd. Voeg MOLLIE_API_KEY toe." };
  }

  const [reservation] = await db
    .select({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
      firstName: reservations.firstName,
      email: reservations.email,
      totalPrice: reservations.totalPrice,
    })
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1);

  if (!reservation) {
    return { message: "Reservering niet gevonden" };
  }

  if (amount <= 0) {
    return { message: "Bedrag moet groter dan 0 zijn" };
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";
    const { paymentId, checkoutUrl } = await createMolliePayment({
      reservationId,
      reservationNumber: reservation.reservationNumber,
      amount,
      description: `Reservering ${reservation.reservationNumber}`,
      redirectUrl: `${appUrl}/payment/complete?reservation=${reservationId}`,
    });

    await logAudit({
      action: "payment.registered",
      entityType: "reservation",
      entityId: reservationId,
      description: `Mollie betaallink aangemaakt: €${amount.toFixed(2)} (${paymentId})`,
      metadata: { molliePaymentId: paymentId, amount, checkoutUrl },
    });

    revalidatePath(`/reservations/${reservationId}`);
    return { success: true, checkoutUrl };
  } catch (error) {
    console.error("[mollie] Failed to create payment:", error);
    return { message: "Kon geen betaallink aanmaken. Probeer het opnieuw." };
  }
}

// --- Send payment link via email ---

export async function sendPaymentLinkAction(
  reservationId: string,
  amount: number
): Promise<MollieActionState> {
  const result = await createPaymentLinkAction(reservationId, amount);
  if (!result?.success || !result.checkoutUrl) {
    return result;
  }

  const [reservation] = await db
    .select({
      firstName: reservations.firstName,
      email: reservations.email,
      reservationNumber: reservations.reservationNumber,
      arrivalDate: reservations.arrivalDate,
      departureDate: reservations.departureDate,
    })
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1);

  if (!reservation) {
    return { message: "Reservering niet gevonden" };
  }

  try {
    const email = buildPaymentLinkEmail({
      firstName: reservation.firstName,
      reservationNumber: reservation.reservationNumber,
      amount,
      checkoutUrl: result.checkoutUrl,
      arrivalDate: reservation.arrivalDate,
      departureDate: reservation.departureDate,
    });

    await sendMail({ to: reservation.email, ...email });

    await logAudit({
      action: "payment.registered",
      entityType: "reservation",
      entityId: reservationId,
      description: `Betaallink verstuurd naar ${reservation.email} (€${amount.toFixed(2)})`,
    });

    revalidatePath(`/reservations/${reservationId}`);
    return { success: true, checkoutUrl: result.checkoutUrl };
  } catch (error) {
    console.error("[mollie] Failed to send payment email:", error);
    return {
      success: true,
      checkoutUrl: result.checkoutUrl,
      message: "Betaallink aangemaakt, maar e-mail kon niet verstuurd worden. Kopieer de link handmatig.",
    };
  }
}

// --- Refund ---

export async function refundPaymentAction(
  reservationId: string,
  amount: number,
  description?: string
): Promise<MollieActionState> {
  if (!isMollieConfigured()) {
    return { message: "Mollie is niet geconfigureerd" };
  }

  // Find a paid Mollie payment for this reservation
  const [molliePayment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.reservationId, reservationId),
        eq(payments.method, "MOLLIE"),
        isNotNull(payments.molliePaymentId)
      )
    )
    .limit(1);

  if (!molliePayment || !molliePayment.molliePaymentId) {
    return { message: "Geen Mollie betaling gevonden voor deze reservering" };
  }

  try {
    const refundId = await createMollieRefund({
      paymentId: molliePayment.molliePaymentId,
      amount,
      description: description || `Terugbetaling reservering`,
    });

    await logAudit({
      action: "payment.registered",
      entityType: "reservation",
      entityId: reservationId,
      description: `Terugbetaling van €${amount.toFixed(2)} geïnitieerd via Mollie (${refundId})`,
      metadata: { refundId, amount, molliePaymentId: molliePayment.molliePaymentId },
    });

    revalidatePath(`/reservations/${reservationId}`);
    return { success: true };
  } catch (error) {
    console.error("[mollie] Failed to create refund:", error);
    return { message: "Kon terugbetaling niet verwerken. Probeer het opnieuw." };
  }
}
