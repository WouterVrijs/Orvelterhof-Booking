import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations, blockedPeriods } from "@/lib/db/schema";
import { and, lt, gt, inArray } from "drizzle-orm";
import { processBookingRequest } from "@/lib/services/booking-intake";

// Shared API key authentication
function authenticateRequest(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.BOOKING_API_KEY;

  if (!apiKey) {
    console.error("[api/bookings] BOOKING_API_KEY is not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null; // authenticated
}

/**
 * GET /api/bookings?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns confirmed reservations and blocked periods in the given date range.
 * Used by the marketing website to check availability.
 * Authenticated via API key in the Authorization header.
 */
export async function GET(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing required query parameters: from, to" },
      { status: 400 }
    );
  }

  try {
    // Fetch confirmed reservations that overlap with the range
    const confirmedReservations = await db
      .select({
        id: reservations.id,
        startDate: reservations.arrivalDate,
        endDate: reservations.departureDate,
        status: reservations.status,
      })
      .from(reservations)
      .where(
        and(
          inArray(reservations.status, ["CONFIRMED"]),
          lt(reservations.arrivalDate, to),
          gt(reservations.departureDate, from)
        )
      );

    // Fetch blocked periods that overlap with the range
    const blocks = await db
      .select({
        id: blockedPeriods.id,
        startDate: blockedPeriods.startDate,
        endDate: blockedPeriods.endDate,
      })
      .from(blockedPeriods)
      .where(
        and(
          lt(blockedPeriods.startDate, to),
          gt(blockedPeriods.endDate, from)
        )
      );

    // Map to the format expected by the marketing website
    const bookings = [
      ...confirmedReservations.map((r) => ({
        id: r.id,
        startDate: r.startDate,
        endDate: r.endDate,
        status: "confirmed",
      })),
      ...blocks.map((b) => ({
        id: b.id,
        startDate: b.startDate,
        endDate: b.endDate,
        status: "blocked",
      })),
    ];

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("[api/bookings] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 *
 * Public API endpoint for the website booking module to submit booking requests.
 * Authenticated via API key in the Authorization header.
 *
 * Request body (JSON):
 *   firstName, lastName, email, phone?, arrivalDate, departureDate, numberOfGuests, guestNote?
 *
 * Responses:
 *   201 — Booking request created successfully
 *   400 — Validation failed
 *   401 — Missing or invalid API key
 *   409 — Dates not available
 *   500 — Internal server error
 */
export async function POST(request: NextRequest) {
  const authError = authenticateRequest(request);
  if (authError) return authError;

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // 3. Process booking request
  try {
    const result = await processBookingRequest(body);

    if (!result.success) {
      // Distinguish validation errors from availability conflicts
      const status = result.details ? 400 : 409;
      return NextResponse.json(
        {
          error: result.error,
          ...(result.details && { details: result.details }),
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        message: "Booking request received",
        reservationId: result.reservationId,
        reservationNumber: result.reservationNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/bookings] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
