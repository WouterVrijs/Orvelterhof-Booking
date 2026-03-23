"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, type UserRole } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

export type UserActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | null;

// --- Get all users (admin only) ---

export async function getUsers() {
  await requireAdmin();
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);
}

// --- Create user ---

const createUserSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres"),
  password: z.string().min(8, "Wachtwoord moet minimaal 8 tekens bevatten"),
  role: z.enum(["ADMIN", "USER"]),
});

export async function createUserAction(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requireAdmin();

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  };

  const result = createUserSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { name, email, password, role } = result.data;

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (existing) {
    return { message: "Dit e-mailadres is al in gebruik" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    isActive: true,
  });

  revalidatePath("/settings/users");
  return { success: true };
}

// --- Update user ---

const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Naam is verplicht"),
  role: z.enum(["ADMIN", "USER"]),
});

export async function updateUserAction(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const session = await requireAdmin();

  const raw = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    role: formData.get("role") as string,
  };

  const result = updateUserSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { id, name, role } = result.data;

  // Prevent admin from removing their own admin role
  if (id === session.id && role !== "ADMIN") {
    return { message: "Je kunt je eigen admin-rol niet verwijderen" };
  }

  await db
    .update(users)
    .set({ name, role })
    .where(eq(users.id, id));

  revalidatePath("/settings/users");
  return { success: true };
}

// --- Deactivate user ---

export async function deactivateUserAction(
  userId: string
): Promise<UserActionState> {
  const session = await requireAdmin();

  if (userId === session.id) {
    return { message: "Je kunt je eigen account niet deactiveren" };
  }

  await db
    .update(users)
    .set({ isActive: false })
    .where(eq(users.id, userId));

  revalidatePath("/settings/users");
  return { success: true };
}

// --- Activate user ---

export async function activateUserAction(
  userId: string
): Promise<UserActionState> {
  await requireAdmin();

  await db
    .update(users)
    .set({ isActive: true })
    .where(eq(users.id, userId));

  revalidatePath("/settings/users");
  return { success: true };
}

// --- Reset password ---

export async function resetUserPasswordAction(
  userId: string,
  newPassword: string
): Promise<UserActionState> {
  await requireAdmin();

  if (newPassword.length < 8) {
    return { message: "Wachtwoord moet minimaal 8 tekens bevatten" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));

  revalidatePath("/settings/users");
  return { success: true };
}
