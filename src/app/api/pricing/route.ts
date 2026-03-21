import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { costItems } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * GET /api/pricing
 *
 * Returns all active cost items grouped by category.
 * Used by the marketing website to display prices dynamically.
 * Authenticated via API key in the Authorization header.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.BOOKING_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db
      .select()
      .from(costItems)
      .where(eq(costItems.isActive, true))
      .orderBy(asc(costItems.sortOrder), asc(costItems.name));

    const baseItem = items.find((i) => i.category === "BASE");
    const mandatoryCosts = items
      .filter((i) => i.category === "MANDATORY")
      .map(formatItem);
    const upgrades = items
      .filter((i) => i.category === "UPGRADE")
      .map(formatItem);

    return NextResponse.json({
      basePrice: baseItem
        ? { perNight: parseFloat(baseItem.price), type: baseItem.type }
        : null,
      mandatoryCosts,
      upgrades,
    });
  } catch (error) {
    console.error("[api/pricing] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatItem(item: typeof costItems.$inferSelect) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    price: parseFloat(item.price),
  };
}
