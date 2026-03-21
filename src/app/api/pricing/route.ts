import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  costItems,
  seasons,
  stayTypePrices,
  specialArrangements,
} from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

/**
 * GET /api/pricing
 *
 * Returns all active pricing configuration:
 * - Cost items (base price, mandatory costs, upgrades)
 * - Seasonal periods with stay type prices
 * - Special arrangements (holidays with fixed prices)
 *
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
    // Cost items
    const items = await db
      .select()
      .from(costItems)
      .where(eq(costItems.isActive, true))
      .orderBy(asc(costItems.sortOrder), asc(costItems.name));

    const baseItem = items.find((i) => i.category === "BASE");
    const mandatoryCosts = items
      .filter((i) => i.category === "MANDATORY")
      .map(formatCostItem);
    const upgrades = items
      .filter((i) => i.category === "UPGRADE")
      .map(formatCostItem);

    // Seasons
    const allSeasons = await db
      .select()
      .from(seasons)
      .orderBy(asc(seasons.year), asc(seasons.sortOrder));

    const seasonIds = allSeasons.map((s) => s.id);
    const allPrices =
      seasonIds.length > 0
        ? await db
            .select()
            .from(stayTypePrices)
            .where(inArray(stayTypePrices.seasonId, seasonIds))
        : [];

    // Group seasons by year + name
    const seasonGroups = new Map<
      string,
      {
        year: number;
        name: string;
        dateRanges: { startDate: string; endDate: string }[];
        stayTypes: { type: string; nights: number; price: number }[];
      }
    >();

    for (const s of allSeasons) {
      const key = `${s.year}-${s.name}`;
      const existing = seasonGroups.get(key);
      if (existing) {
        existing.dateRanges.push({
          startDate: s.startDate,
          endDate: s.endDate,
        });
      } else {
        const seasonPrices = allPrices
          .filter((p) => p.seasonId === s.id)
          .map((p) => ({
            type: p.stayType,
            nights: p.nights,
            price: parseFloat(p.price),
          }));

        seasonGroups.set(key, {
          year: s.year,
          name: s.name,
          dateRanges: [{ startDate: s.startDate, endDate: s.endDate }],
          stayTypes: seasonPrices,
        });
      }
    }

    // For grouped seasons with multiple date ranges, merge prices from all rows
    for (const s of allSeasons) {
      const key = `${s.year}-${s.name}`;
      const group = seasonGroups.get(key)!;
      const seasonPrices = allPrices
        .filter((p) => p.seasonId === s.id)
        .map((p) => ({
          type: p.stayType,
          nights: p.nights,
          price: parseFloat(p.price),
        }));
      // Add prices not already in the group
      for (const sp of seasonPrices) {
        if (!group.stayTypes.some((st) => st.type === sp.type)) {
          group.stayTypes.push(sp);
        }
      }
    }

    // Special arrangements
    const allArrangements = await db
      .select()
      .from(specialArrangements)
      .orderBy(asc(specialArrangements.year), asc(specialArrangements.sortOrder));

    return NextResponse.json({
      basePrice: baseItem
        ? { perNight: parseFloat(baseItem.price), type: baseItem.type }
        : null,
      mandatoryCosts,
      upgrades,
      seasons: Array.from(seasonGroups.values()),
      specialArrangements: allArrangements.map((a) => ({
        id: a.id,
        year: a.year,
        name: a.name,
        startDate: a.startDate,
        endDate: a.endDate,
        price: a.price ? parseFloat(a.price) : null,
        isBooked: a.isBooked,
      })),
    });
  } catch (error) {
    console.error("[api/pricing] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatCostItem(item: typeof costItems.$inferSelect) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    price: parseFloat(item.price),
  };
}
