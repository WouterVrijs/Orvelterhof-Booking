import Link from "next/link";
import { LogIn, LogOut as LogOutIcon, Home, Users, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatFullName } from "@/lib/utils/format";
import type { UpcomingReservation, WeekSummary, OccupancyInfo } from "@/lib/services/dashboard";

interface TodayOverviewProps {
  todayArrivals: UpcomingReservation[];
  todayDepartures: UpcomingReservation[];
  weekSummary: WeekSummary;
  occupancy: OccupancyInfo;
}

export function TodayOverview({
  todayArrivals,
  todayDepartures,
  weekSummary,
  occupancy,
}: TodayOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vandaag & deze week</CardTitle>
      </CardHeader>
      <CardContent>

      {/* Stats row — borderless blocks */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <MiniStat
          label="Vandaag in"
          value={weekSummary.todayArrivals}
          icon={<LogIn className="h-3.5 w-3.5 text-green-600" />}
        />
        <MiniStat
          label="Vandaag uit"
          value={weekSummary.todayDepartures}
          icon={<LogOutIcon className="h-3.5 w-3.5 text-purple-600" />}
        />
        <MiniStat
          label="Deze week in"
          value={weekSummary.weekArrivals}
          icon={<Activity className="h-3.5 w-3.5 text-blue-600" />}
        />
        <MiniStat
          label="Gasten deze week"
          value={weekSummary.totalGuestsThisWeek}
          icon={<Users className="h-3.5 w-3.5 text-neutral-500" />}
        />

        {/* Occupancy inline */}
        <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${
          occupancy.isOccupied ? "bg-green-100/60" : "bg-white"
        }`}>
          <Home className={`h-3.5 w-3.5 ${occupancy.isOccupied ? "text-green-600" : "text-neutral-400"}`} />
          <div>
            <p className={`text-lg font-semibold ${occupancy.isOccupied ? "text-green-800" : "text-neutral-400"}`}>
              {occupancy.isOccupied ? "Bezet" : "Vrij"}
            </p>
            <p className="text-[11px] text-neutral-500 leading-tight">
              {occupancy.isOccupied
                ? `${occupancy.guestName?.split(" ")[0]}`
                : "Beschikbaar"}
            </p>
          </div>
        </div>
      </div>

      {/* Today's check-ins and check-outs */}
      {(todayArrivals.length > 0 || todayDepartures.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {todayArrivals.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-green-700">
                <LogIn className="h-3 w-3" />
                Inchecken vandaag
              </p>
              <div className="space-y-1.5">
                {todayArrivals.map((r) => (
                  <Link
                    key={r.id}
                    href={`/reservations/${r.id}`}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm transition-colors hover:bg-green-50"
                  >
                    <span className="font-medium text-neutral-900">
                      {formatFullName(r.firstName, r.lastName)}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {r.numberOfGuests} {r.numberOfGuests === 1 ? "gast" : "gasten"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {todayDepartures.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-purple-700">
                <LogOutIcon className="h-3 w-3" />
                Uitchecken vandaag
              </p>
              <div className="space-y-1.5">
                {todayDepartures.map((r) => (
                  <Link
                    key={r.id}
                    href={`/reservations/${r.id}`}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm transition-colors hover:bg-purple-50"
                  >
                    <span className="font-medium text-neutral-900">
                      {formatFullName(r.firstName, r.lastName)}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {r.numberOfGuests} {r.numberOfGuests === 1 ? "gast" : "gasten"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-2">
      {icon}
      <div>
        <p className="text-lg font-semibold text-neutral-900">{value}</p>
        <p className="text-[11px] text-neutral-500 leading-tight">{label}</p>
      </div>
    </div>
  );
}
