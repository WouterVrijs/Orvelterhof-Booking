"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createInvoice,
  getInvoiceForReservation,
  generateInvoiceHtml,
} from "@/lib/services/invoice";
import { sendMail } from "@/lib/services/mail";
import { logAudit } from "@/lib/services/audit";

export type InvoiceActionState = {
  message?: string;
  success?: boolean;
} | null;

// --- Create invoice ---

export async function createInvoiceAction(
  reservationId: string
): Promise<InvoiceActionState> {
  try {
    const invoice = await createInvoice(reservationId);

    await logAudit({
      action: "invoice.created" as "payment.registered",
      entityType: "reservation",
      entityId: reservationId,
      description: `Factuur ${invoice.invoiceNumber} aangemaakt`,
    });

    revalidatePath(`/reservations/${reservationId}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Kon factuur niet aanmaken";
    return { message: msg };
  }
}

// --- Send invoice via email ---

export async function sendInvoiceEmailAction(
  reservationId: string
): Promise<InvoiceActionState> {
  const invoice = await getInvoiceForReservation(reservationId);
  if (!invoice) {
    return { message: "Geen factuur gevonden voor deze reservering" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";
  const downloadUrl = `${appUrl}/api/invoices/${invoice.id}/pdf`;

  try {
    await sendMail({
      to: invoice.guestEmail,
      subject: `Factuur ${invoice.invoiceNumber} — Orvelterhof`,
      html: buildInvoiceEmail(invoice.guestName, invoice.invoiceNumber, invoice.total, downloadUrl),
    });

    // Mark as sent
    await db
      .update(invoices)
      .set({ status: "SENT", sentAt: new Date() })
      .where(eq(invoices.id, invoice.id));

    await logAudit({
      action: "payment.registered",
      entityType: "reservation",
      entityId: reservationId,
      description: `Factuur ${invoice.invoiceNumber} verstuurd naar ${invoice.guestEmail}`,
    });

    revalidatePath(`/reservations/${reservationId}`);
    return { success: true };
  } catch (error) {
    console.error("[invoice] Failed to send email:", error);
    return { message: "Kon factuur niet versturen per e-mail" };
  }
}

// --- Email template ---

function buildInvoiceEmail(
  guestName: string,
  invoiceNumber: string,
  total: string,
  downloadUrl: string
): string {
  const formattedTotal = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(parseFloat(total));

  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #171717;">
      <h2>Factuur ${invoiceNumber}</h2>
      <p>Beste ${guestName.split(" ")[0]},</p>
      <p>Hierbij ontvangt u de factuur voor uw verblijf bij Orvelterhof.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 0; color: #737373; width: 140px;">Factuurnummer</td>
          <td style="padding: 8px 0; font-weight: 500;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #737373;">Totaalbedrag</td>
          <td style="padding: 8px 0; font-weight: 600; font-size: 16px;">${formattedTotal}</td>
        </tr>
      </table>
      <p>
        <a href="${downloadUrl}"
           style="display: inline-block; background: #171717; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
          Factuur bekijken
        </a>
      </p>
      <p style="margin-top: 16px; color: #737373; font-size: 13px;">
        Klik op de knop hierboven om uw factuur te bekijken en te downloaden.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
      <p style="color: #a3a3a3; font-size: 12px;">Orvelterhof Beheer</p>
    </div>
  `.trim();
}
