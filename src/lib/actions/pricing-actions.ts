"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { pricingSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updatePricingSchema } from "@/lib/validations/pricing";
import { calculatePrice, type PriceCalculation } from "@/lib/services/pricing";
import { isDateRangeAvailable } from "@/lib/services/availability";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

/**
 * Get or create the single pricing settings row.
 */
export async function getPricingSettings() {
  const [existing] = await db.select().from(pricingSettings).limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(pricingSettings)
    .values({})
    .returning();

  return created;
}

export async function updatePricingAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    strategy: formData.get("strategy") as string,
    basePrice: formData.get("basePrice") as string,
    cleaningFee: formData.get("cleaningFee") as string,
    depositAmount: formData.get("depositAmount") as string,
  };

  const result = updatePricingSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;
  const settings = await getPricingSettings();

  await db
    .update(pricingSettings)
    .set({
      strategy: data.strategy,
      basePrice: data.basePrice.toString(),
      cleaningFee: data.cleaningFee.toString(),
      depositAmount: data.depositAmount.toString(),
    })
    .where(eq(pricingSettings.id, settings.id));

  revalidatePath("/pricing");
  return { success: true };
}

/**
 * Calculate price preview for given dates (read-only, no mutation).
 */
export async function calculatePriceAction(
  arrivalDate: string,
  departureDate: string
): Promise<PriceCalculation | null> {
  try {
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) return null;
    if (departure <= arrival) return null;
    return await calculatePrice(arrival, departure);
  } catch {
    return null;
  }
}

/**
 * Check availability for given dates (read-only, no mutation).
 */
export async function checkAvailabilityAction(
  arrivalDate: string,
  departureDate: string
): Promise<{ available: boolean; reason?: string } | null> {
  try {
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) return null;
    if (departure <= arrival) return null;
    return await isDateRangeAvailable(arrival, departure);
  } catch {
    return null;
  }
}
