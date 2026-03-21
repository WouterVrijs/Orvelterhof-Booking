"use client";

import { useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateSettingsAction,
  type ActionState,
} from "@/lib/actions/settings-actions";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-sm text-red-600">{errors[0]}</p>;
}

interface SettingsFormProps {
  settings: {
    accommodationName: string;
    contactEmail: string;
    contactPhone: string | null;
    checkInTime: string;
    checkOutTime: string;
    maxGuests: number;
    minStayNights: number;
    defaultCleaningFee: string;
    defaultDeposit: string;
  };
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateSettingsAction,
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Algemene gegevens */}
      <Card>
        <CardHeader>
          <CardTitle>Algemene gegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accommodationName">Naam accommodatie</Label>
            <Input
              id="accommodationName"
              name="accommodationName"
              required
              defaultValue={settings.accommodationName}
            />
            <FieldError errors={state?.errors?.accommodationName} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact e-mailadres</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                required
                defaultValue={settings.contactEmail}
              />
              <FieldError errors={state?.errors?.contactEmail} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact telefoonnummer</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                defaultValue={settings.contactPhone ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boekingsregels */}
      <Card>
        <CardHeader>
          <CardTitle>Boekingsregels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Standaard inchecktijd</Label>
              <Input
                id="checkInTime"
                name="checkInTime"
                type="time"
                required
                defaultValue={settings.checkInTime}
              />
              <FieldError errors={state?.errors?.checkInTime} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Standaard uitchecktijd</Label>
              <Input
                id="checkOutTime"
                name="checkOutTime"
                type="time"
                required
                defaultValue={settings.checkOutTime}
              />
              <FieldError errors={state?.errors?.checkOutTime} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxGuests">Maximaal aantal gasten</Label>
              <Input
                id="maxGuests"
                name="maxGuests"
                type="number"
                min="1"
                required
                defaultValue={settings.maxGuests}
              />
              <FieldError errors={state?.errors?.maxGuests} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStayNights">Minimum verblijfsduur (nachten)</Label>
              <Input
                id="minStayNights"
                name="minStayNights"
                type="number"
                min="1"
                required
                defaultValue={settings.minStayNights}
              />
              <FieldError errors={state?.errors?.minStayNights} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standaard kosten */}
      <Card>
        <CardHeader>
          <CardTitle>Standaard kosten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultCleaningFee">
                Standaard schoonmaakkosten (&euro;)
              </Label>
              <Input
                id="defaultCleaningFee"
                name="defaultCleaningFee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={settings.defaultCleaningFee}
              />
              <FieldError errors={state?.errors?.defaultCleaningFee} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultDeposit">Standaard borgsom (&euro;)</Label>
              <Input
                id="defaultDeposit"
                name="defaultDeposit"
                type="number"
                step="0.01"
                min="0"
                defaultValue={settings.defaultDeposit}
              />
              <FieldError errors={state?.errors?.defaultDeposit} />
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            Deze bedragen worden als standaardwaarden gebruikt bij nieuwe
            reserveringen
          </p>
        </CardContent>
      </Card>

      {/* Feedback */}
      {state?.message && (
        <div
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.message}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Instellingen opgeslagen
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Opslaan..." : "Opslaan"}
      </Button>
    </form>
  );
}
