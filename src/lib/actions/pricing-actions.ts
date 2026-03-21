"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { pricingSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updatePricingSchema } from "@/lib/validations/pricing";

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
