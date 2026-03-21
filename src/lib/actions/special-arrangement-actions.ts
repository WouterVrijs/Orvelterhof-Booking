"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { specialArrangements } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

export async function getSpecialArrangementsByYear(year: number) {
  return db
    .select()
    .from(specialArrangements)
    .where(eq(specialArrangements.year, year))
    .orderBy(asc(specialArrangements.sortOrder), asc(specialArrangements.startDate));
}

const arrangementSchema = z.object({
  year: z.coerce.number().int().min(2024).max(2030),
  name: z.string().min(1, "Naam is verplicht"),
  startDate: z.string().min(1, "Startdatum is verplicht"),
  endDate: z.string().min(1, "Einddatum is verplicht"),
  price: z.coerce.number().min(0).optional(),
  isBooked: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  sortOrder: z.coerce.number().int().default(0),
});

export async function createSpecialArrangementAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    year: formData.get("year") as string,
    name: formData.get("name") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    price: formData.get("price") as string,
    isBooked: formData.get("isBooked") as string,
    sortOrder: formData.get("sortOrder") as string,
  };

  const result = arrangementSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  await db.insert(specialArrangements).values({
    year: data.year,
    name: data.name,
    startDate: data.startDate,
    endDate: data.endDate,
    price: data.price !== undefined ? data.price.toFixed(2) : null,
    isBooked: data.isBooked,
    sortOrder: data.sortOrder,
  });

  revalidatePath("/pricing");
  return { success: true };
}

export async function updateSpecialArrangementAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get("id") as string;
  const raw = {
    year: formData.get("year") as string,
    name: formData.get("name") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    price: formData.get("price") as string,
    isBooked: formData.get("isBooked") as string,
    sortOrder: formData.get("sortOrder") as string,
  };

  const result = arrangementSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  await db
    .update(specialArrangements)
    .set({
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      price: data.price !== undefined ? data.price.toFixed(2) : null,
      isBooked: data.isBooked,
      sortOrder: data.sortOrder,
    })
    .where(eq(specialArrangements.id, id));

  revalidatePath("/pricing");
  return { success: true };
}

export async function deleteSpecialArrangementAction(
  id: string
): Promise<ActionState> {
  await db
    .delete(specialArrangements)
    .where(eq(specialArrangements.id, id));
  revalidatePath("/pricing");
  return { success: true };
}
