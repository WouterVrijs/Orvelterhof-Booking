"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { datesOverlap } from "@/lib/utils/dates";
import type { ReservationStatus, BlockType } from "@/lib/types";

interface CalendarReservation {
  id: string;
  arrivalDate: Date;
  departureDate: Date;
  status: ReservationStatus;
  firstName: string;
  lastName: string;
}

interface CalendarBlock {
  id: string;
  startDate: Date;
  endDate: Date;
  blockType: BlockType;
}

interface CalendarViewProps {
  reservations: CalendarReservation[];
  blockedPeriods: CalendarBlock[];
}

export function CalendarView({
  reservations,
  blockedPeriods,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of the week the month starts on (0 = Sunday, adjust to Monday = 0)
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;

  function getDayStatus(day: Date) {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const confirmedReservation = reservations.find(
      (r) =>
        r.status === "CONFIRMED" &&
        datesOverlap(r.arrivalDate, r.departureDate, dayStart, dayEnd)
    );
    if (confirmedReservation) return "confirmed";

    const pendingReservation = reservations.find(
      (r) =>
        (r.status === "NEW" || r.status === "IN_PROGRESS") &&
        datesOverlap(r.arrivalDate, r.departureDate, dayStart, dayEnd)
    );
    if (pendingReservation) return "pending";

    const blocked = blockedPeriods.find((bp) =>
      datesOverlap(bp.startDate, bp.endDate, dayStart, dayEnd)
    );
    if (blocked) return "blocked";

    return "available";
  }

  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: nl })}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Vandaag
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-px">
        {weekDays.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-neutral-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px">
        {/* Empty cells for days before month start */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-16" />
        ))}

        {days.map((day) => {
          const status = getDayStatus(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex h-16 flex-col items-center justify-center rounded-md text-sm transition-colors",
                isToday(day) && "ring-2 ring-neutral-900",
                status === "confirmed" && "bg-green-100 text-green-800",
                status === "pending" && "bg-blue-50 text-blue-700",
                status === "blocked" && "bg-neutral-200 text-neutral-500",
                status === "available" && "hover:bg-neutral-50"
              )}
            >
              <span className="font-medium">{format(day, "d")}</span>
              {status !== "available" && (
                <span className="mt-0.5 text-[10px]">
                  {status === "confirmed" && "Bezet"}
                  {status === "pending" && "Aanvraag"}
                  {status === "blocked" && "Geblokkeerd"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-neutral-500">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-green-100" />
          <span>Bevestigd</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-blue-50" />
          <span>Aanvraag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-neutral-200" />
          <span>Geblokkeerd</span>
        </div>
      </div>
    </Card>
  );
}
