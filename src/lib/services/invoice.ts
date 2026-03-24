import { db } from "@/lib/db";
import {
  invoices,
  reservations,
  reservationLineItems,
  accommodationSettings,
} from "@/lib/db/schema";
import { eq, asc, desc, sql } from "drizzle-orm";

// --- Types ---

export interface InvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// --- Generate invoice number ---

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `F${year}-`;

  // Find the highest invoice number for this year
  const [latest] = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} LIKE ${prefix + "%"}`)
    .orderBy(desc(invoices.invoiceNumber))
    .limit(1);

  let sequence = 1;
  if (latest) {
    const lastNum = parseInt(latest.invoiceNumber.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) sequence = lastNum + 1;
  }

  return `${prefix}${String(sequence).padStart(4, "0")}`;
}

// --- Create invoice ---

export async function createInvoice(reservationId: string) {
  // Fetch reservation
  const [reservation] = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1);

  if (!reservation) throw new Error("Reservering niet gevonden");

  // Check if invoice already exists
  const [existing] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.reservationId, reservationId))
    .limit(1);

  if (existing) throw new Error("Er bestaat al een factuur voor deze reservering");

  // Fetch line items
  const lineItems = await db
    .select()
    .from(reservationLineItems)
    .where(eq(reservationLineItems.reservationId, reservationId))
    .orderBy(asc(reservationLineItems.createdAt));

  // Fetch accommodation settings
  const [settings] = await db.select().from(accommodationSettings).limit(1);

  const invoiceLineItems: InvoiceLineItem[] = lineItems.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: parseFloat(item.unitPrice),
    totalPrice: parseFloat(item.totalPrice),
  }));

  // If no line items, use totalPrice as single line
  if (invoiceLineItems.length === 0 && reservation.totalPrice) {
    invoiceLineItems.push({
      name: `Verblijf ${reservation.arrivalDate} - ${reservation.departureDate}`,
      quantity: 1,
      unitPrice: parseFloat(reservation.totalPrice),
      totalPrice: parseFloat(reservation.totalPrice),
    });
  }

  const subtotal = invoiceLineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const vatRate = 21;
  const vatAmount = subtotal * (vatRate / (100 + vatRate)); // BTW is inclusief
  const total = subtotal;

  const invoiceNumber = await generateInvoiceNumber();

  const [invoice] = await db
    .insert(invoices)
    .values({
      reservationId,
      invoiceNumber,
      guestName: `${reservation.firstName} ${reservation.lastName}`,
      guestEmail: reservation.email,
      accommodationName: settings?.accommodationName || "Orvelterhof",
      arrivalDate: reservation.arrivalDate,
      departureDate: reservation.departureDate,
      numberOfGuests: reservation.numberOfGuests,
      subtotal: subtotal.toFixed(2),
      vatRate: vatRate.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2),
      lineItems: JSON.stringify(invoiceLineItems),
      invoiceDate: new Date().toISOString().split("T")[0],
    })
    .returning();

  return invoice;
}

// --- Get invoice for reservation ---

export async function getInvoiceForReservation(reservationId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.reservationId, reservationId))
    .limit(1);

  return invoice || null;
}

// --- Get all invoices ---

export async function getAllInvoices() {
  return db
    .select()
    .from(invoices)
    .orderBy(desc(invoices.createdAt));
}

// --- Generate PDF as HTML string (for server-side rendering) ---

export function generateInvoiceHtml(invoice: typeof invoices.$inferSelect): string {
  const lineItems: InvoiceLineItem[] = JSON.parse(invoice.lineItems);

  const formatEuro = (amount: number | string) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
      typeof amount === "string" ? parseFloat(amount) : amount
    );

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "General Sans", "Helvetica Neue", Arial, sans-serif; color: #171717; font-size: 13px; line-height: 1.5; }
    .page { max-width: 700px; margin: 0 auto; padding: 48px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 48px; }
    .header h1 { font-size: 24px; font-weight: 600; }
    .header .meta { text-align: right; color: #737373; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party { width: 45%; }
    .party-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #a3a3a3; margin-bottom: 8px; }
    .details { margin-bottom: 32px; }
    .details-grid { display: grid; grid-template-columns: 140px 1fr; gap: 4px 16px; }
    .details-label { color: #737373; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 10px 12px; border-bottom: 2px solid #e5e5e5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #737373; }
    th:last-child, td:last-child { text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid #f5f5f5; }
    .totals { margin-left: auto; width: 280px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .row.total { border-top: 2px solid #171717; font-weight: 600; font-size: 16px; padding-top: 10px; margin-top: 4px; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5; color: #a3a3a3; font-size: 11px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <h1>Factuur</h1>
        <p style="color: #737373; margin-top: 4px;">${invoice.invoiceNumber}</p>
      </div>
      <div class="meta">
        <p><strong>${invoice.accommodationName}</strong></p>
        <p>Factuurdatum: ${invoice.invoiceDate}</p>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-label">Factuur aan</div>
        <p><strong>${invoice.guestName}</strong></p>
        <p>${invoice.guestEmail}</p>
      </div>
    </div>

    <div class="details">
      <div class="details-grid">
        <span class="details-label">Aankomst</span>
        <span>${invoice.arrivalDate}</span>
        <span class="details-label">Vertrek</span>
        <span>${invoice.departureDate}</span>
        <span class="details-label">Gasten</span>
        <span>${invoice.numberOfGuests}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Omschrijving</th>
          <th>Aantal</th>
          <th>Prijs</th>
          <th>Totaal</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems
          .map(
            (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${formatEuro(item.unitPrice)}</td>
          <td>${formatEuro(item.totalPrice)}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="row">
        <span>Subtotaal (incl. BTW)</span>
        <span>${formatEuro(invoice.subtotal)}</span>
      </div>
      <div class="row">
        <span>Waarvan BTW ${invoice.vatRate}%</span>
        <span>${formatEuro(invoice.vatAmount)}</span>
      </div>
      <div class="row total">
        <span>Totaal</span>
        <span>${formatEuro(invoice.total)}</span>
      </div>
    </div>

    <div class="footer">
      <p>${invoice.accommodationName} · ${invoice.invoiceNumber} · ${invoice.invoiceDate}</p>
    </div>
  </div>
</body>
</html>`;
}
