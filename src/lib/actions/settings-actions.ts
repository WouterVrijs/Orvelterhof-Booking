"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { accommodationSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateSettingsSchema } from "@/lib/validations/settings";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

/**
 * Get or create the single accommodation settings row.
 */
export async function getAccommodationSettings() {
  const [existing] = await db
    .select()
    .from(accommodationSettings)
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(accommodationSettings)
    .values({})
    .returning();

  return created;
}

export async function updateSettingsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    accommodationName: formData.get("accommodationName") as string,
    contactEmail: formData.get("contactEmail") as string,
    contactPhone: (formData.get("contactPhone") as string) || undefined,
    checkInTime: formData.get("checkInTime") as string,
    checkOutTime: formData.get("checkOutTime") as string,
    maxGuests: formData.get("maxGuests") as string,
    minStayNights: formData.get("minStayNights") as string,
    defaultCleaningFee: formData.get("defaultCleaningFee") as string,
    defaultDeposit: formData.get("defaultDeposit") as string,
  };

  const result = updateSettingsSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;
  const settings = await getAccommodationSettings();

  await db
    .update(accommodationSettings)
    .set({
      accommodationName: data.accommodationName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      maxGuests: data.maxGuests,
      minStayNights: data.minStayNights,
      defaultCleaningFee: data.defaultCleaningFee.toString(),
      defaultDeposit: data.defaultDeposit.toString(),
    })
    .where(eq(accommodationSettings.id, settings.id));

  revalidatePath("/settings");
  return { success: true };
}
