"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { datesOverlap, formatDate } from "@/lib/utils/dates";
import { BLOCK_TYPE_LABELS } from "@/lib/types";
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
  reason?: string | null;
}

interface CalendarViewProps {
  reservations: CalendarReservation[];
  blockedPeriods: CalendarBlock[];
}

type DayInfo =
  | { type: "available" }
  | { type: "confirmed"; reservation: CalendarReservation }
  | { type: "pending"; reservation: CalendarReservation }
  | { type: "blocked"; block: CalendarBlock };

export function CalendarView({
  reservations,
  blockedPeriods,
}: CalendarViewProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    info: DayInfo;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setSelectedDay(null);
      }
    }
    if (selectedDay) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [selectedDay]);

  // Close popover on month change
  useEffect(() => {
    setSelectedDay(null);
  }, [currentMonth]);

  function getDayInfo(day: Date): DayInfo {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const confirmed = reservations.find(
      (r) =>
        r.status === "CONFIRMED" &&
        datesOverlap(r.arrivalDate, r.departureDate, dayStart, dayEnd)
    );
    if (confirmed) return { type: "confirmed", reservation: confirmed };

    const pending = reservations.find(
      (r) =>
        (r.status === "NEW" || r.status === "IN_PROGRESS") &&
        datesOverlap(r.arrivalDate, r.departureDate, dayStart, dayEnd)
    );
    if (pending) return { type: "pending", reservation: pending };

    const block = blockedPeriods.find((bp) =>
      datesOverlap(bp.startDate, bp.endDate, dayStart, dayEnd)
    );
    if (block) return { type: "blocked", block };

    return { type: "available" };
  }

  function handleDayClick(day: Date, info: DayInfo) {
    // Available day: navigate to create reservation with date prefilled
    if (info.type === "available") {
      const dateStr = format(day, "yyyy-MM-dd");
      router.push(`/reservations/new?arrivalDate=${dateStr}`);
      return;
    }

    // Toggle if same day clicked
    if (
      selectedDay &&
      selectedDay.date.toDateString() === day.toDateString()
    ) {
      setSelectedDay(null);
      return;
    }

    setSelectedDay({ date: day, info });
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
      <div className="relative grid grid-cols-7 gap-px">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-16" />
        ))}

        {days.map((day) => {
          const info = getDayInfo(day);
          const isClickable = true; // All days are clickable
          const isSelected =
            selectedDay?.date.toDateString() === day.toDateString();

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDayClick(day, info)}
              className={cn(
                "flex h-16 flex-col items-center justify-center rounded-md text-sm transition-colors",
                isToday(day) && "ring-2 ring-neutral-900",
                info.type === "confirmed" && "bg-green-100 text-green-800",
                info.type === "pending" && "bg-blue-50 text-blue-700",
                info.type === "blocked" && "bg-neutral-200 text-neutral-500",
                info.type === "available" && "hover:bg-neutral-50",
                isClickable && "cursor-pointer",
                isSelected && "ring-2 ring-neutral-900"
              )}
            >
              <span className="font-medium">{format(day, "d")}</span>
              {info.type !== "available" && (
                <span className="mt-0.5 text-[10px]">
                  {info.type === "confirmed" && "Bezet"}
                  {info.type === "pending" && "Aanvraag"}
                  {info.type === "blocked" && "Geblokkeerd"}
                </span>
              )}
            </div>
          );
        })}

        {/* Popover */}
        {selectedDay && (
          <div
            ref={popoverRef}
            className="absolute left-1/2 top-1/2 z-10 w-72 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-200 bg-white p-4 shadow-lg"
          >
            {selectedDay.info.type === "blocked" && (
              <BlockedPopover block={selectedDay.info.block} />
            )}
            {(selectedDay.info.type === "confirmed" ||
              selectedDay.info.type === "pending") && (
              <ReservationPopover
                reservation={selectedDay.info.reservation}
              />
            )}
            <button
              onClick={() => setSelectedDay(null)}
              className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-600"
            >
              ×
            </button>
          </div>
        )}
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

function ReservationPopover({
  reservation,
}: {
  reservation: CalendarReservation;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-neutral-900">
          {reservation.firstName} {reservation.lastName}
        </p>
        <StatusBadge status={reservation.status} />
      </div>
      <div className="space-y-1 text-sm text-neutral-600">
        <p>
          {formatDate(reservation.arrivalDate)} –{" "}
          {formatDate(reservation.departureDate)}
        </p>
      </div>
      <Link
        href={`/reservations/${reservation.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 hover:underline"
      >
        Bekijk reservering
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function BlockedPopover({ block }: { block: CalendarBlock }) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-neutral-900">Geblokkeerde periode</p>
      <div className="space-y-1 text-sm text-neutral-600">
        <p>
          {formatDate(block.startDate)} – {formatDate(block.endDate)}
        </p>
        <p>
          Type:{" "}
          {BLOCK_TYPE_LABELS[block.blockType] ?? block.blockType}
        </p>
        {block.reason && <p>Reden: {block.reason}</p>}
      </div>
    </div>
  );
}
