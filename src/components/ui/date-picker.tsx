"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMonthAvailability } from "@/lib/actions/calendar-actions";

interface DateRange {
  start: string;
  end: string;
}

interface AvailabilityData {
  confirmedRanges: DateRange[];
  pendingRanges: DateRange[];
  blockedRanges: DateRange[];
}

function isDayInRanges(dayISO: string, ranges: DateRange[]): boolean {
  return ranges.some((r) => dayISO >= r.start && dayISO < r.end);
}

interface DatePickerProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  name?: string;
  required?: boolean;
  /** Earliest selectable date (YYYY-MM-DD). Days before this are disabled. */
  minDate?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  id,
  name,
  required,
  minDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? new Date(value + "T00:00:00") : new Date()
  );
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen]);

  // Fetch availability when month changes or picker opens
  const fetchAvailability = useCallback(async (month: Date) => {
    const from = format(startOfMonth(month), "yyyy-MM-dd");
    const to = format(endOfMonth(addMonths(month, 0)), "yyyy-MM-dd");
    // Fetch a slightly wider range to cover edge cases
    const fromPadded = format(
      startOfMonth(subMonths(month, 0)),
      "yyyy-MM-dd"
    );
    const toPadded = format(endOfMonth(addMonths(month, 1)), "yyyy-MM-dd");
    const data = await getMonthAvailability(fromPadded, toPadded);
    setAvailability(data);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAvailability(viewMonth);
    }
  }, [isOpen, viewMonth, fetchAvailability]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;
  const today = startOfDay(new Date());

  function getDayStatus(dayISO: string, day: Date) {
    // Past dates (before today) are disabled
    if (isBefore(day, today)) return "past";
    // Min date constraint
    if (minDate && dayISO < minDate) return "past";

    if (!availability) return "available";

    if (isDayInRanges(dayISO, availability.confirmedRanges)) return "confirmed";
    if (isDayInRanges(dayISO, availability.pendingRanges)) return "pending";
    if (isDayInRanges(dayISO, availability.blockedRanges)) return "blocked";
    return "available";
  }

  function handleDayClick(dayISO: string) {
    onChange(dayISO);
    setIsOpen(false);
  }

  const displayValue = value
    ? format(new Date(value + "T00:00:00"), "d MMM yyyy", { locale: nl })
    : "";

  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Trigger */}
      <button
        type="button"
        id={id}
        onClick={() => {
          if (!isOpen && value) {
            setViewMonth(new Date(value + "T00:00:00"));
          }
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          !value && "text-neutral-400"
        )}
      >
        <span>{displayValue || "Kies een datum"}</span>
        <Calendar className="h-4 w-4 text-neutral-400" />
      </button>

      {/* Dropdown calendar */}
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
          {/* Month navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="rounded p-1 hover:bg-neutral-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">
              {format(viewMonth, "MMMM yyyy", { locale: nl })}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="rounded p-1 hover:bg-neutral-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7">
            {weekDays.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[11px] font-medium text-neutral-400"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} className="h-8" />
            ))}

            {days.map((day) => {
              const dayISO = format(day, "yyyy-MM-dd");
              const status = getDayStatus(dayISO, day);
              const isSelected = value === dayISO;
              const isSelectable =
                status === "available" || status === "pending";

              return (
                <button
                  key={dayISO}
                  type="button"
                  disabled={!isSelectable}
                  onClick={() => isSelectable && handleDayClick(dayISO)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded text-xs transition-colors",
                    isToday(day) && "font-bold",
                    isSelected &&
                      "bg-neutral-900 text-white",
                    !isSelected &&
                      status === "available" &&
                      "hover:bg-neutral-100",
                    !isSelected &&
                      status === "confirmed" &&
                      "bg-green-100 text-green-700 cursor-not-allowed",
                    !isSelected &&
                      status === "pending" &&
                      "bg-blue-50 text-blue-600",
                    !isSelected &&
                      status === "blocked" &&
                      "bg-neutral-200 text-neutral-400 cursor-not-allowed",
                    status === "past" &&
                      "text-neutral-300 cursor-not-allowed"
                  )}
                  title={
                    status === "confirmed"
                      ? "Bezet"
                      : status === "blocked"
                        ? "Geblokkeerd"
                        : status === "pending"
                          ? "Aanvraag"
                          : undefined
                  }
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Mini legend */}
          <div className="mt-2 flex items-center gap-3 border-t border-neutral-100 pt-2 text-[10px] text-neutral-400">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded bg-green-100" />
              Bezet
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded bg-blue-50" />
              Aanvraag
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded bg-neutral-200" />
              Geblokkeerd
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
