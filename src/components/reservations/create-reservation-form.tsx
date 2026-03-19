"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createReservationAction,
  type ActionState,
} from "@/lib/actions/reservation-actions";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-sm text-red-600">{errors[0]}</p>;
}

export function CreateReservationForm() {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(createReservationAction, null);

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-6">
          {/* Gastgegevens */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Voornaam</Label>
              <Input id="firstName" name="firstName" required />
              <FieldError errors={state?.errors?.firstName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Achternaam</Label>
              <Input id="lastName" name="lastName" required />
              <FieldError errors={state?.errors?.lastName} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="off"
              />
              <FieldError errors={state?.errors?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoonnummer</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
          </div>

          {/* Verblijf */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="arrivalDate">Aankomstdatum</Label>
              <Input
                id="arrivalDate"
                name="arrivalDate"
                type="date"
                required
              />
              <FieldError errors={state?.errors?.arrivalDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departureDate">Vertrekdatum</Label>
              <Input
                id="departureDate"
                name="departureDate"
                type="date"
                required
              />
              <FieldError errors={state?.errors?.departureDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfGuests">Aantal gasten</Label>
              <Input
                id="numberOfGuests"
                name="numberOfGuests"
                type="number"
                min="1"
                required
              />
              <FieldError errors={state?.errors?.numberOfGuests} />
            </div>
          </div>

          {/* Bron */}
          <div className="space-y-2">
            <Label htmlFor="source">Bron</Label>
            <Select id="source" name="source" defaultValue="MANUAL">
              <option value="MANUAL">Handmatig</option>
              <option value="PHONE">Telefoon</option>
              <option value="EMAIL">E-mail</option>
            </Select>
          </div>

          {/* Notities */}
          <div className="space-y-2">
            <Label htmlFor="guestNote">Opmerking gast</Label>
            <Textarea id="guestNote" name="guestNote" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNote">Interne notitie</Label>
            <Textarea id="internalNote" name="internalNote" rows={3} />
          </div>

          {/* Generieke foutmelding (overlap etc.) */}
          {state?.message && (
            <div
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {state.message}
            </div>
          )}

          {/* Acties */}
          <div className="flex justify-end gap-3">
            <Link href="/reservations">
              <Button type="button" variant="outline">
                Annuleren
              </Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Aanmaken..." : "Reservering aanmaken"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
