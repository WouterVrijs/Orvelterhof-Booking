"use client";

import { useActionState } from "react";
import Link from "next/link";
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
import { loginAction, type LoginState } from "@/lib/actions/auth-actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-lg font-bold text-white">
          O
        </div>
        <CardTitle className="text-xl">Orvelterhof Beheer</CardTitle>
        <CardDescription>Log in om verder te gaan</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* E-mailadres */}
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

          {/* Wachtwoord */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Wachtwoord</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-neutral-500 hover:text-neutral-700 hover:underline"
                tabIndex={-1}
              >
                Wachtwoord vergeten?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              aria-describedby={
                state?.errors?.password ? "password-error" : undefined
              }
            />
            {state?.errors?.password && (
              <p id="password-error" className="text-sm text-red-600">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          {/* Generieke foutmelding */}
          {state?.message && (
            <div
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {state.message}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Bezig met inloggen..." : "Inloggen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
