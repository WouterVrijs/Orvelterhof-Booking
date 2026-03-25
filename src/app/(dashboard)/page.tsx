import Link from "next/link";
import {
  CalendarCheck,
  Calendar,
  Euro,
  Settings,
  Inbox,
  CheckCircle2,
  LogIn,
  LogOut as LogOutIcon,
  Plus,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionItems } from "@/components/dashboard/action-items";
import { Notifications } from "@/components/dashboard/notifications";
import { TodayOverview } from "@/components/dashboard/today-overview";
import { RecentRequests } from "@/components/dashboard/recent-requests";
import {
  getDashboardStats,
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
    stats, arrivals, departures, actionItems, notifications,
    todayArr, todayDep, weekSummary, occupancy, recentRequests,
  ] = await Promise.all([
      getDashboardStats(),
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
    <div className="space-y-8">
      {/* Actie vereist — prominent bovenaan */}
      <ActionItems items={actionItems} />

      {/* Operationeel dagoverzicht */}
      <TodayOverview
        todayArrivals={todayArr}
        todayDepartures={todayDep}
        weekSummary={weekSummary}
        occupancy={occupancy}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Inbox className="h-5 w-5 text-blue-600" />}
          title="Nieuwe aanvragen"
          value={stats.newRequests}
          href="/reservations?status=NEW"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          title="Bevestigd"
          value={stats.confirmed}
          href="/reservations?status=CONFIRMED"
        />
        <StatCard
          icon={<LogIn className="h-5 w-5 text-amber-600" />}
          title="Aankomsten (7 dagen)"
          value={stats.upcomingArrivals}
        />
        <StatCard
          icon={<LogOutIcon className="h-5 w-5 text-purple-600" />}
          title="Vertrekken (7 dagen)"
          value={stats.upcomingDepartures}
        />
      </div>

      {/* Upcoming arrivals & departures + notifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
        </div>

        {/* Meldingen sidebar */}
        <Notifications notifications={notifications} />
      </div>

      {/* Recente reserveringen */}
      <RecentRequests requests={recentRequests} />

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Snelle acties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <QuickAction
              href="/reservations/new"
              icon={<Plus className="h-5 w-5" />}
              label="Reservering"
            />
            <QuickAction
              href="/reservations"
              icon={<CalendarCheck className="h-5 w-5" />}
              label="Reserveringen"
            />
            <QuickAction
              href="/calendar"
              icon={<Calendar className="h-5 w-5" />}
              label="Kalender"
            />
            <QuickAction
              href="/pricing"
              icon={<Euro className="h-5 w-5" />}
              label="Prijzen"
            />
            <QuickAction
              href="/settings"
              icon={<Settings className="h-5 w-5" />}
              label="Instellingen"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Sub-components ---

function StatCard({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  href?: string;
}) {
  const content = (
    <Card className="transition-colors hover:border-neutral-300">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-50">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-sm text-neutral-500">{title}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Link
          href="/reservations"
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          Alles bekijken
        </Link>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <p className="text-sm text-neutral-500">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => (
              <Link
                key={r.id}
                href={`/reservations/${r.id}`}
                className="flex items-center justify-between rounded-lg border border-neutral-100 p-3 transition-colors hover:bg-neutral-50"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatFullName(r.firstName, r.lastName)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {dateLabel}: {formatDate(r[dateField])} &middot;{" "}
                    {r.numberOfGuests}{" "}
                    {r.numberOfGuests === 1 ? "gast" : "gasten"}
                  </p>
                </div>
                <StatusBadge status={r.status as ReservationStatus} />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
      <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
        {icon}
        <span className="text-xs">{label}</span>
      </Button>
    </Link>
  );
}
