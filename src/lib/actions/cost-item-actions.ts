"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { costItems } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

const costItemSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  type: z.enum([
    "FIXED",
    "PER_PERSON",
    "PER_NIGHT",
    "PER_PERSON_PER_NIGHT",
    "PER_UNIT",
  ]),
  price: z.coerce.number().min(0, "Prijs moet minimaal 0 zijn"),
  category: z.enum(["BASE", "MANDATORY", "UPGRADE"]),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  sortOrder: z.coerce.number().int().default(0),
});

export async function getCostItems() {
  return db
    .select()
    .from(costItems)
    .orderBy(asc(costItems.sortOrder), asc(costItems.name));
}

export async function createCostItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    price: formData.get("price") as string,
    category: formData.get("category") as string,
    isActive: formData.get("isActive") as string,
    sortOrder: formData.get("sortOrder") as string,
  };

  const result = costItemSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  await db.insert(costItems).values({
    name: data.name,
    type: data.type,
    price: data.price.toFixed(2),
    category: data.category,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  });

  revalidatePath("/pricing");
  return { success: true };
}

export async function updateCostItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get("id") as string;
  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    price: formData.get("price") as string,
    category: formData.get("category") as string,
    isActive: formData.get("isActive") as string,
    sortOrder: formData.get("sortOrder") as string,
  };

  const result = costItemSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  await db
    .update(costItems)
    .set({
      name: data.name,
      type: data.type,
      price: data.price.toFixed(2),
      category: data.category,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    })
    .where(eq(costItems.id, id));

  revalidatePath("/pricing");
  return { success: true };
}

export async function deleteCostItemAction(id: string): Promise<ActionState> {
  await db.delete(costItems).where(eq(costItems.id, id));
  revalidatePath("/pricing");
  return { success: true };
}
