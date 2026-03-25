import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils/dates";
import { formatFullName } from "@/lib/utils/format";
import { RESERVATION_SOURCE_LABELS } from "@/lib/types";
import type { ReservationStatus, ReservationSource } from "@/lib/types";
import type { RecentRequest } from "@/lib/services/dashboard";

export function RecentRequests({ requests }: { requests: RecentRequest[] }) {
  if (requests.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recente reserveringen</CardTitle>
        <Link
          href="/reservations"
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          Alles bekijken
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                <th className="pb-2 pr-4">Gast</th>
                <th className="pb-2 pr-4">Periode</th>
                <th className="pb-2 pr-4 text-center">Gasten</th>
                <th className="pb-2 pr-4">Bron</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {requests.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-neutral-50">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/reservations/${r.id}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {formatFullName(r.firstName, r.lastName)}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-neutral-600">
                    {formatDate(r.arrivalDate)} — {formatDate(r.departureDate)}
                  </td>
                  <td className="py-2.5 pr-4 text-center text-neutral-600">
                    {r.numberOfGuests}
                  </td>
                  <td className="py-2.5 pr-4 text-neutral-500">
                    {RESERVATION_SOURCE_LABELS[r.source as ReservationSource] ?? r.source}
                  </td>
                  <td className="py-2.5">
                    <StatusBadge status={r.status as ReservationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
