"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyCredentials, createSession, deleteSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mailadres is verplicht")
    .email("Voer een geldig e-mailadres in"),
  password: z.string().min(1, "Wachtwoord is verplicht"),
});

export type LoginState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
} | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate input
  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Verify credentials against database
  const user = await verifyCredentials(result.data.email, result.data.password);
  if (!user) {
    return {
      message: "Ongeldige inloggegevens",
    };
  }

  // Create session and redirect to dashboard
  await createSession(user);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
