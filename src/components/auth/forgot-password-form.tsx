"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
  forgotPasswordAction,
  type ForgotPasswordState,
} from "@/lib/actions/password-actions";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    ForgotPasswordState,
    FormData
  >(forgotPasswordAction, null);

  if (state?.success) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-lg font-bold text-white">
            O
          </div>
          <CardTitle className="text-xl">Controleer je e-mail</CardTitle>
          <CardDescription>
            We hebben je instructies gestuurd
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele
            minuten een e-mail met instructies om je wachtwoord te herstellen.
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4" />
              Terug naar inloggen
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-lg font-bold text-white">
          O
        </div>
        <CardTitle className="text-xl">Wachtwoord vergeten</CardTitle>
        <CardDescription>
          Voer je e-mailadres in om je wachtwoord te herstellen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="naam@voorbeeld.nl"
              required
              autoComplete="email"
              autoFocus
              aria-describedby={
                state?.errors?.email ? "email-error" : undefined
              }
            />
            {state?.errors?.email && (
              <p id="email-error" className="text-sm text-red-600">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Versturen..." : "Verstuur herstelinstructies"}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline"
            >
              Terug naar inloggen
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
