"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { seasons, stayTypePrices } from "@/lib/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { z } from "zod";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

// --- Queries ---

export async function getSeasonsByYear(year: number) {
  const allSeasons = await db
    .select()
    .from(seasons)
    .where(eq(seasons.year, year))
    .orderBy(asc(seasons.sortOrder), asc(seasons.name));

  // Group by name (a season like "Periode 1" can have multiple date ranges)
  const grouped = new Map<
    string,
    { name: string; year: number; ranges: typeof allSeasons; sortOrder: number }
  >();

  for (const s of allSeasons) {
    const existing = grouped.get(s.name);
    if (existing) {
      existing.ranges.push(s);
    } else {
      grouped.set(s.name, {
        name: s.name,
        year: s.year,
        ranges: [s],
        sortOrder: s.sortOrder,
      });
    }
  }

  // Fetch stay type prices for each season row
  const seasonIds = allSeasons.map((s) => s.id);
  const prices =
    seasonIds.length > 0
      ? await db
          .select()
          .from(stayTypePrices)
          .where(
            inArray(stayTypePrices.seasonId, seasonIds)
          )
      : [];

  return { seasons: Array.from(grouped.values()), allSeasonRows: allSeasons, prices };
}

// --- Season CRUD ---

const seasonSchema = z.object({
  year: z.coerce.number().int().min(2024).max(2030),
  name: z.string().min(1, "Naam is verplicht"),
  startDate: z.string().min(1, "Startdatum is verplicht"),
  endDate: z.string().min(1, "Einddatum is verplicht"),
  sortOrder: z.coerce.number().int().default(0),
});

export async function createSeasonAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    year: formData.get("year") as string,
    name: formData.get("name") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    sortOrder: formData.get("sortOrder") as string,
  };

  const result = seasonSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await db.insert(seasons).values(result.data);

  revalidatePath("/pricing");
  return { success: true };
}

export async function deleteSeasonAction(id: string): Promise<ActionState> {
  await db.delete(seasons).where(eq(seasons.id, id));
  revalidatePath("/pricing");
  return { success: true };
}

// --- Stay Type Price CRUD ---

const stayTypePriceSchema = z.object({
  seasonId: z.string().uuid(),
  stayType: z.enum(["WEEKEND", "LONG_WEEKEND", "MIDWEEK", "WEEK"]),
  nights: z.coerce.number().int().min(1),
  price: z.coerce.number().min(0),
});

export async function upsertStayTypePriceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    seasonId: formData.get("seasonId") as string,
    stayType: formData.get("stayType") as string,
    nights: formData.get("nights") as string,
    price: formData.get("price") as string,
  };

  const result = stayTypePriceSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  // Check if exists
  const [existing] = await db
    .select({ id: stayTypePrices.id })
    .from(stayTypePrices)
    .where(
      and(
        eq(stayTypePrices.seasonId, data.seasonId),
        eq(stayTypePrices.stayType, data.stayType)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(stayTypePrices)
      .set({ price: data.price.toFixed(2), nights: data.nights })
      .where(eq(stayTypePrices.id, existing.id));
  } else {
    await db.insert(stayTypePrices).values({
      seasonId: data.seasonId,
      stayType: data.stayType,
      nights: data.nights,
      price: data.price.toFixed(2),
    });
  }

  revalidatePath("/pricing");
  return { success: true };
}
