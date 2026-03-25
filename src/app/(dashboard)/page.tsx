import Link from "next/link";
import {
  CalendarCheck,
  Calendar,
  Euro,
  Settings,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionItems } from "@/components/dashboard/action-items";
import { Notifications } from "@/components/dashboard/notifications";
import { TodayOverview } from "@/components/dashboard/today-overview";
import { RecentRequests } from "@/components/dashboard/recent-requests";
import {
  getUpcomingArrivals,
  getUpcomingDepartures,
  getActionItems,
  getNotifications,
  getTodayArrivals,
  getTodayDepartures,
  getWeekSummary,
  getCurrentOccupancy,
  getRecentRequests,
  type UpcomingReservation,
} from "@/lib/services/dashboard";
import { formatDate } from "@/lib/utils/dates";
import { formatFullName } from "@/lib/utils/format";
import type { ReservationStatus } from "@/lib/types";

export default async function DashboardPage() {
  const [
    arrivals, departures, actionItems, notifications,
    todayArr, todayDep, weekSummary, occupancy, recentRequests,
  ] = await Promise.all([
    getUpcomingArrivals(),
    getUpcomingDepartures(),
    getActionItems(),
    getNotifications(),
    getTodayArrivals(),
    getTodayDepartures(),
    getWeekSummary(),
    getCurrentOccupancy(),
    getRecentRequests(),
  ]);

  return (
    <div className="space-y-12">
      {/* ─── Zone 1: Prioriteit ─── */}
      <ActionItems items={actionItems} />

      {/* ─── Zone 2: Dagelijks operationeel ─── */}
      <TodayOverview
        todayArrivals={todayArr}
        todayDepartures={todayDep}
        weekSummary={weekSummary}
        occupancy={occupancy}
      />

      {/* ─── Zone 3: Planning & meldingen ─── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Komende dagen
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <ReservationList
              title="Aankomende aankomsten"
              emptyMessage="Geen aankomsten in de komende 7 dagen"
              reservations={arrivals}
              dateLabel="Aankomst"
              dateField="arrivalDate"
            />
            <ReservationList
              title="Aankomende vertrekken"
              emptyMessage="Geen vertrekken in de komende 7 dagen"
              reservations={departures}
              dateLabel="Vertrek"
              dateField="departureDate"
            />
          </div>
          <Notifications notifications={notifications} />
        </div>
      </section>

      {/* ─── Zone 4: Recente reserveringen ─── */}
      <RecentRequests requests={recentRequests} />

      {/* ─── Zone 5: Snelle acties (compact) ─── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Snelle acties
        </h2>
        <div className="flex flex-wrap gap-2">
          <QuickAction href="/reservations/new" icon={<Plus className="h-3.5 w-3.5" />} label="Reservering" />
          <QuickAction href="/reservations" icon={<CalendarCheck className="h-3.5 w-3.5" />} label="Reserveringen" />
          <QuickAction href="/calendar" icon={<Calendar className="h-3.5 w-3.5" />} label="Kalender" />
          <QuickAction href="/pricing" icon={<Euro className="h-3.5 w-3.5" />} label="Prijzen" />
          <QuickAction href="/settings" icon={<Settings className="h-3.5 w-3.5" />} label="Instellingen" />
        </div>
      </section>
    </div>
  );
}

// --- Sub-components ---

function ReservationList({
  title,
  emptyMessage,
  reservations,
  dateLabel,
  dateField,
}: {
  title: string;
  emptyMessage: string;
  reservations: UpcomingReservation[];
  dateLabel: string;
  dateField: "arrivalDate" | "departureDate";
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-500">{title}</p>
        <Link
          href="/reservations"
          className="text-xs text-neutral-400 hover:text-neutral-600"
        >
          Alles
        </Link>
      </div>
      {reservations.length === 0 ? (
        <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-400">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-1.5">
          {reservations.map((r) => (
            <Link
              key={r.id}
              href={`/reservations/${r.id}`}
              className="flex items-center justify-between rounded-lg border border-neutral-100 bg-white px-3 py-2.5 text-sm transition-colors hover:bg-neutral-50"
            >
              <div>
                <p className="font-medium text-neutral-900">
                  {formatFullName(r.firstName, r.lastName)}
                </p>
                <p className="text-xs text-neutral-500">
                  {dateLabel}: {formatDate(r[dateField])} · {r.numberOfGuests}{" "}
                  {r.numberOfGuests === 1 ? "gast" : "gasten"}
                </p>
              </div>
              <StatusBadge status={r.status as ReservationStatus} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href}>
      <Button
        variant="outline"
        className="h-9 gap-1.5 px-3 text-xs text-neutral-600"
      >
        {icon}
        {label}
      </Button>
    </Link>
  );
}
