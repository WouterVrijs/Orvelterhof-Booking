import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge";
import { formatDate } from "@/lib/utils/dates";
import { formatFullName, formatCurrency } from "@/lib/utils/format";
import type { ReservationListItem } from "@/lib/services/reservations";
import type { ReservationStatus, PaymentStatus } from "@/lib/types";

interface ReservationTableProps {
  reservations: ReservationListItem[];
}

export function ReservationTable({ reservations }: ReservationTableProps) {
  if (reservations.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 p-8 text-center">
        <p className="text-sm text-neutral-500">
          Geen reserveringen gevonden
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
            <th className="px-4 py-3">Nummer</th>
            <th className="px-4 py-3">Gast</th>
            <th className="px-4 py-3">Aankomst</th>
            <th className="px-4 py-3">Vertrek</th>
            <th className="px-4 py-3 text-center">Gasten</th>
            <th className="px-4 py-3 text-right">Prijs</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Betaling</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {reservations.map((r) => (
            <tr
              key={r.id}
              className="transition-colors hover:bg-neutral-50"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/reservations/${r.id}`}
                  className="font-mono text-xs text-neutral-600 hover:text-neutral-900 hover:underline"
                >
                  {r.reservationNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/reservations/${r.id}`}
                  className="hover:underline"
                >
                  <div className="font-medium text-neutral-900">
                    {formatFullName(r.firstName, r.lastName)}
                  </div>
                  <div className="text-xs text-neutral-500">{r.email}</div>
                </Link>
              </td>
              <td className="px-4 py-3 text-neutral-700">
                {formatDate(r.arrivalDate)}
              </td>
              <td className="px-4 py-3 text-neutral-700">
                {formatDate(r.departureDate)}
              </td>
              <td className="px-4 py-3 text-center text-neutral-700">
                {r.numberOfGuests}
              </td>
              <td className="px-4 py-3 text-right text-neutral-700">
                {formatCurrency(r.totalPrice)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status as ReservationStatus} />
              </td>
              <td className="px-4 py-3">
                <PaymentStatusBadge status={r.paymentStatus as PaymentStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
