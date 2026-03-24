import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { reservations, reservationLineItems } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ReservationDetail } from "@/components/reservations/reservation-detail";
import { PaymentCard } from "@/components/reservations/payment-card";
import { MollieActions } from "@/components/reservations/mollie-actions";
import { InvoiceCard } from "@/components/reservations/invoice-card";
import { AuditHistory } from "@/components/reservations/audit-history";
import { getAuditLogsForEntity } from "@/lib/services/audit";
import { getPaymentsForReservation } from "@/lib/actions/payment-actions";
import { getInvoiceForReservation } from "@/lib/services/invoice";
import { isMollieConfigured } from "@/lib/services/mollie";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservationDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [reservation] = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, id))
    .limit(1);

  if (!reservation) {
    notFound();
  }

  const [auditLogs, lineItems, paymentsList, invoice] = await Promise.all([
    getAuditLogsForEntity("reservation", id),
    db
      .select()
      .from(reservationLineItems)
      .where(eq(reservationLineItems.reservationId, id))
      .orderBy(asc(reservationLineItems.createdAt)),
    getPaymentsForReservation(id),
    getInvoiceForReservation(id),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/reservations"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar overzicht
      </Link>

      <ReservationDetail reservation={reservation} />

      {/* Prijsspecificatie */}
      {lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prijsspecificatie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-neutral-600">
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="text-neutral-400">
                        {" "}
                        ({item.quantity}×)
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-neutral-900">
                    {new Intl.NumberFormat("nl-NL", {
                      style: "currency",
                      currency: "EUR",
                    }).format(parseFloat(item.totalPrice))}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-sm font-medium">
                <span>Totaal</span>
                <span>
                  {new Intl.NumberFormat("nl-NL", {
                    style: "currency",
                    currency: "EUR",
                  }).format(
                    lineItems.reduce(
                      (sum, item) => sum + parseFloat(item.totalPrice),
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Betalingen */}
      <PaymentCard
        reservationId={reservation.id}
        totalPrice={reservation.totalPrice}
        amountPaid={reservation.amountPaid}
        paymentStatus={reservation.paymentStatus}
        payments={paymentsList}
      />

      {/* Mollie online betalen */}
      <MollieActions
        reservationId={reservation.id}
        totalPrice={reservation.totalPrice}
        amountPaid={reservation.amountPaid}
        paymentStatus={reservation.paymentStatus}
        isMollieEnabled={isMollieConfigured()}
      />

      {/* Factuur */}
      <InvoiceCard reservationId={reservation.id} invoice={invoice} />

      <AuditHistory logs={auditLogs} />
    </div>
  );
}
