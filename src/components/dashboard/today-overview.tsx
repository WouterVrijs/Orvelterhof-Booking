import Link from "next/link";
import { LogIn, LogOut as LogOutIcon, Home, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-4">
      {/* Week summary + occupancy */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Vandaag in" value={weekSummary.todayArrivals} icon={<LogIn className="h-4 w-4 text-green-600" />} />
        <MiniStat label="Vandaag uit" value={weekSummary.todayDepartures} icon={<LogOutIcon className="h-4 w-4 text-purple-600" />} />
        <MiniStat label="Deze week in" value={weekSummary.weekArrivals} icon={<Users className="h-4 w-4 text-blue-600" />} />
        <MiniStat label="Gasten deze week" value={weekSummary.totalGuestsThisWeek} icon={<Users className="h-4 w-4 text-neutral-600" />} />
      </div>

      {/* Occupancy indicator */}
      <Card className={occupancy.isOccupied ? "border-green-200 bg-green-50/30" : "border-neutral-200"}>
        <CardContent className="flex items-center gap-3 p-4">
          <Home className={`h-5 w-5 ${occupancy.isOccupied ? "text-green-600" : "text-neutral-400"}`} />
          {occupancy.isOccupied ? (
            <div>
              <p className="text-sm font-medium text-green-800">Bezet</p>
              <p className="text-xs text-green-700">
                {occupancy.guestName} · {occupancy.numberOfGuests} gasten · vertrek {occupancy.departureDate}
              </p>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Beschikbaar — geen gasten aanwezig</p>
          )}
        </CardContent>
      </Card>

      {/* Today's check-ins and check-outs */}
      {(todayArrivals.length > 0 || todayDepartures.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {todayArrivals.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <LogIn className="h-4 w-4 text-green-600" />
                  Inchecken vandaag
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todayArrivals.map((r) => (
                    <Link
                      key={r.id}
                      href={`/reservations/${r.id}`}
                      className="flex items-center justify-between rounded-md border border-neutral-100 p-2 text-sm transition-colors hover:bg-neutral-50"
                    >
                      <span className="font-medium">{formatFullName(r.firstName, r.lastName)}</span>
                      <span className="text-xs text-neutral-500">{r.numberOfGuests} gasten</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {todayDepartures.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <LogOutIcon className="h-4 w-4 text-purple-600" />
                  Uitchecken vandaag
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todayDepartures.map((r) => (
                    <Link
                      key={r.id}
                      href={`/reservations/${r.id}`}
                      className="flex items-center justify-between rounded-md border border-neutral-100 p-2 text-sm transition-colors hover:bg-neutral-50"
                    >
                      <span className="font-medium">{formatFullName(r.firstName, r.lastName)}</span>
                      <span className="text-xs text-neutral-500">{r.numberOfGuests} gasten</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
      {icon}
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}
