"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/lib/actions/password-actions";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState<
    ResetPasswordState,
    FormData
  >(resetPasswordAction, null);

  // Success state
  if (state?.success) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Wachtwoord gewijzigd</CardTitle>
          <CardDescription>
            Je wachtwoord is succesvol gewijzigd
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="w-full">Inloggen met nieuw wachtwoord</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Token invalid state
  if (state?.tokenInvalid) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-lg font-bold text-white">
            O
          </div>
          <CardTitle className="text-xl">Link ongeldig</CardTitle>
          <CardDescription>
            Deze resetlink is niet meer geldig
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700"
            role="alert"
          >
            {state.message}
          </div>
          <Link href="/forgot-password">
            <Button variant="outline" className="w-full">
              Nieuwe reset aanvragen
            </Button>
          </Link>
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline"
            >
              Terug naar inloggen
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Form state
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-lg font-bold text-white">
          O
        </div>
        <CardTitle className="text-xl">Nieuw wachtwoord instellen</CardTitle>
        <CardDescription>
          Kies een nieuw wachtwoord voor je account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          <div className="space-y-2">
            <Label htmlFor="password">Nieuw wachtwoord</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
              aria-describedby={
                state?.errors?.password ? "password-error" : undefined
              }
            />
            {state?.errors?.password ? (
              <p id="password-error" className="text-sm text-red-600">
                {state.errors.password[0]}
              </p>
            ) : (
              <p className="text-xs text-neutral-500">
                Minimaal 8 karakters
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              aria-describedby={
                state?.errors?.confirmPassword
                  ? "confirm-password-error"
                  : undefined
              }
            />
            {state?.errors?.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-red-600">
                {state.errors.confirmPassword[0]}
              </p>
            )}
          </div>

          {state?.message && !state.tokenInvalid && (
            <div
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {state.message}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Wachtwoord wijzigen..." : "Wachtwoord wijzigen"}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline"
            >
              <ArrowLeft className="mr-1 inline h-3 w-3" />
              Terug naar inloggen
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
