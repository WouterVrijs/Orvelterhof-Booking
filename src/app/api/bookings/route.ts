import { NextRequest, NextResponse } from "next/server";
import { processBookingRequest } from "@/lib/services/booking-intake";

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
  // 1. Authenticate via API key
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

  // 2. Parse request body
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
