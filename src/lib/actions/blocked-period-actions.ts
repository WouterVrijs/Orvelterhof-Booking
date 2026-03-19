"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { blockedPeriods, reservations } from "@/lib/db/schema";
import { and, eq, lt, gt } from "drizzle-orm";
import { createBlockedPeriodSchema } from "@/lib/validations/calendar";
import { formatDateISO } from "@/lib/utils/dates";
import { z } from "zod";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

// Check if date range overlaps with any confirmed reservation
async function hasReservationOverlap(
  startDate: Date,
  endDate: Date,
  excludeId?: string
): Promise<boolean> {
  const start = formatDateISO(startDate);
  const end = formatDateISO(endDate);

  const [result] = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(
      and(
        eq(reservations.status, "CONFIRMED"),
        lt(reservations.arrivalDate, end),
        gt(reservations.departureDate, start)
      )
    )
    .limit(1);

  return !!result;
}

// --- Create ---

export async function createBlockedPeriodAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    reason: (formData.get("reason") as string) || undefined,
    blockType: (formData.get("blockType") as string) || "MANUAL",
  };

  const result = createBlockedPeriodSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  const overlap = await hasReservationOverlap(data.startDate, data.endDate);
  if (overlap) {
    return {
      message:
        "Er is een bevestigde reservering in deze periode. Blokkeren is niet mogelijk.",
    };
  }

  await db.insert(blockedPeriods).values({
    startDate: formatDateISO(data.startDate),
    endDate: formatDateISO(data.endDate),
    reason: data.reason || null,
    blockType: data.blockType,
  });

  revalidatePath("/calendar");
  return { success: true };
}

// --- Update ---

const updateBlockedPeriodSchema = z
  .object({
    id: z.string().uuid(),
    startDate: z.coerce.date({ error: "Startdatum is verplicht" }),
    endDate: z.coerce.date({ error: "Einddatum is verplicht" }),
    reason: z.string().optional(),
    blockType: z.enum(["MANUAL", "MAINTENANCE", "OWNER", "OTHER"]),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Einddatum moet na startdatum liggen",
    path: ["endDate"],
  });

export async function updateBlockedPeriodAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    id: formData.get("id") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    reason: (formData.get("reason") as string) || undefined,
    blockType: (formData.get("blockType") as string) || "MANUAL",
  };

  const result = updateBlockedPeriodSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  // Verify exists
  const [existing] = await db
    .select({ id: blockedPeriods.id })
    .from(blockedPeriods)
    .where(eq(blockedPeriods.id, data.id))
    .limit(1);

  if (!existing) {
    return { message: "Geblokkeerde periode niet gevonden" };
  }

  const overlap = await hasReservationOverlap(data.startDate, data.endDate);
  if (overlap) {
    return {
      message:
        "Er is een bevestigde reservering in deze periode. Blokkeren is niet mogelijk.",
    };
  }

  await db
    .update(blockedPeriods)
    .set({
      startDate: formatDateISO(data.startDate),
      endDate: formatDateISO(data.endDate),
      reason: data.reason || null,
      blockType: data.blockType,
    })
    .where(eq(blockedPeriods.id, data.id));

  revalidatePath("/calendar");
  return { success: true };
}

// --- Delete ---

export async function deleteBlockedPeriodAction(
  id: string
): Promise<ActionState> {
  const [existing] = await db
    .select({ id: blockedPeriods.id })
    .from(blockedPeriods)
    .where(eq(blockedPeriods.id, id))
    .limit(1);

  if (!existing) {
    return { message: "Geblokkeerde periode niet gevonden" };
  }

  await db.delete(blockedPeriods).where(eq(blockedPeriods.id, id));

  revalidatePath("/calendar");
  return { success: true };
}
