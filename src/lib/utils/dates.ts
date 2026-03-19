import { format, differenceInDays, isAfter, isBefore, isEqual } from "date-fns";
import { nl } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM yyyy", { locale: nl });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd-MM-yyyy");
}

export function formatDateISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getNights(arrival: Date, departure: Date): number {
  return differenceInDays(departure, arrival);
}

export function datesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  // Two ranges overlap if one starts before the other ends
  // Using < (not <=) because departure day = check-out, arrival of next = check-in on same day is allowed
  return isBefore(startA, endB) && isBefore(startB, endA);
}

export function isValidDateRange(arrival: Date, departure: Date): boolean {
  return isAfter(departure, arrival);
}

export function isDateInRange(
  date: Date,
  start: Date,
  end: Date
): boolean {
  return (isAfter(date, start) || isEqual(date, start)) &&
         (isBefore(date, end) || isEqual(date, end));
}
