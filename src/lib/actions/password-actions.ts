"use server";

import { z } from "zod";
import {
  createPasswordResetToken,
  validateResetToken,
  consumeTokenAndResetPassword,
} from "@/lib/services/password-reset";
import { sendMail, buildPasswordResetEmail } from "@/lib/services/mail";

// --- Forgot password ---

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "E-mailadres is verplicht")
    .email("Voer een geldig e-mailadres in"),
});

export type ForgotPasswordState = {
  errors?: { email?: string[] };
  success?: boolean;
} | null;

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const result = forgotPasswordSchema.safeParse({
    email: formData.get("email") as string,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const email = result.data.email;

  // Always return success to prevent account enumeration
  // Process the actual token creation in the background
  const tokenResult = await createPasswordResetToken(email);

  if (tokenResult) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";
    const resetUrl = `${appUrl}/reset-password?token=${tokenResult.token}`;
    const { subject, html } = buildPasswordResetEmail(
      tokenResult.userName,
      resetUrl
    );

    try {
      await sendMail({ to: email, subject, html });
    } catch (error) {
      // Log error server-side but don't expose to user
      console.error("Failed to send password reset email:", error);
    }
  }

  return { success: true };
}

// --- Reset password ---

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is verplicht"),
    password: z
      .string()
      .min(8, "Wachtwoord moet minimaal 8 karakters bevatten"),
    confirmPassword: z.string().min(1, "Bevestig je wachtwoord"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Wachtwoorden komen niet overeen",
    path: ["confirmPassword"],
  });

export type ResetPasswordState = {
  errors?: {
    token?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
  success?: boolean;
  tokenInvalid?: boolean;
} | null;

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const result = resetPasswordSchema.safeParse({
    token: formData.get("token") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Validate the token
  const tokenData = await validateResetToken(result.data.token);
  if (!tokenData) {
    return {
      tokenInvalid: true,
      message:
        "Deze resetlink is ongeldig of verlopen. Vraag een nieuwe reset aan.",
    };
  }

  // Reset the password
  await consumeTokenAndResetPassword(
    tokenData.tokenId,
    tokenData.userId,
    result.data.password
  );

  return { success: true };
}
