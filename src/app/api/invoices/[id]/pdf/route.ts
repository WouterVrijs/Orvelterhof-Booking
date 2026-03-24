import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateInvoiceHtml } from "@/lib/services/invoice";

/**
 * GET /api/invoices/[id]/pdf
 *
 * Returns the invoice as an HTML page that can be printed/saved as PDF
 * via the browser's built-in print dialog (Cmd+P → Save as PDF).
 *
 * This is a public endpoint (linked from emails) — the invoice ID
 * serves as the access token (UUIDs are unguessable).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const html = generateInvoiceHtml(invoice);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
