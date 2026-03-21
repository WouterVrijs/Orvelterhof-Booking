"use client";

import { useState, useEffect, useActionState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  createReservationAction,
  type ActionState,
} from "@/lib/actions/reservation-actions";
import {
  calculatePriceAction,
  checkAvailabilityAction,
} from "@/lib/actions/pricing-actions";
import type { PriceCalculation } from "@/lib/services/pricing";
import { CheckCircle2, XCircle } from "lucide-react";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-sm text-red-600">{errors[0]}</p>;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function CreateReservationForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createReservationAction,
    null
  );

  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [pricePreview, setPricePreview] = useState<PriceCalculation | null>(
    null
  );
  const [priceLoading, setPriceLoading] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason?: string;
  } | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Fetch price preview and availability when both dates are valid
  useEffect(() => {
    if (!arrivalDate || !departureDate || departureDate <= arrivalDate) {
      setPricePreview(null);
      setAvailability(null);
      return;
    }

    setPriceLoading(true);
    setAvailabilityLoading(true);

    calculatePriceAction(arrivalDate, departureDate)
      .then((result) => setPricePreview(result))
      .finally(() => setPriceLoading(false));

    checkAvailabilityAction(arrivalDate, departureDate)
      .then((result) => setAvailability(result))
      .finally(() => setAvailabilityLoading(false));
  }, [arrivalDate, departureDate]);

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
              <DatePicker
                id="arrivalDate"
                name="arrivalDate"
                required
                value={arrivalDate}
                onChange={setArrivalDate}
              />
              <FieldError errors={state?.errors?.arrivalDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departureDate">Vertrekdatum</Label>
              <DatePicker
                id="departureDate"
                name="departureDate"
                required
                value={departureDate}
                onChange={setDepartureDate}
                minDate={arrivalDate || undefined}
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

          {/* Beschikbaarheid */}
          {(availability || availabilityLoading) && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 text-sm",
                availabilityLoading && "border-neutral-200 bg-neutral-50 text-neutral-500",
                !availabilityLoading && availability?.available && "border-green-200 bg-green-50 text-green-800",
                !availabilityLoading && availability && !availability.available && "border-red-200 bg-red-50 text-red-800"
              )}
            >
              {availabilityLoading ? (
                "Beschikbaarheid controleren..."
              ) : availability?.available ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Deze periode is beschikbaar
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 shrink-0" />
                  {availability?.reason || "Deze periode is niet beschikbaar"}
                </>
              )}
            </div>
          )}

          {/* Prijspreview */}
          {(pricePreview || priceLoading) && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="mb-2 text-sm font-medium text-neutral-700">
                Prijsindicatie
              </p>
              {priceLoading ? (
                <p className="text-sm text-neutral-500">Berekenen...</p>
              ) : pricePreview ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>
                      {pricePreview.strategy === "PER_NIGHT"
                        ? `${pricePreview.nights} nachten × ${formatEuro(pricePreview.baseAmount / pricePreview.nights)}`
                        : "Vast verblijfstarief"}
                    </span>
                    <span>{formatEuro(pricePreview.baseAmount)}</span>
                  </div>
                  {pricePreview.cleaningFee > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Schoonmaakkosten</span>
                      <span>{formatEuro(pricePreview.cleaningFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-neutral-200 pt-1 font-medium text-neutral-900">
                    <span>Totaal</span>
                    <span>{formatEuro(pricePreview.totalPrice)}</span>
                  </div>
                  {pricePreview.depositAmount > 0 && (
                    <div className="flex justify-between text-neutral-500">
                      <span>Borgsom (apart)</span>
                      <span>{formatEuro(pricePreview.depositAmount)}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

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
            <Button
              type="submit"
              disabled={isPending || (availability !== null && !availability.available)}
            >
              {isPending ? "Aanmaken..." : "Reservering aanmaken"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
