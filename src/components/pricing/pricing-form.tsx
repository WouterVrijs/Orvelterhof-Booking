"use client";

import { useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updatePricingAction,
  type ActionState,
} from "@/lib/actions/pricing-actions";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-sm text-red-600">{errors[0]}</p>;
}

interface PricingFormProps {
  settings: {
    strategy: string;
    basePrice: string;
    cleaningFee: string;
    depositAmount: string;
  };
}

export function PricingForm({ settings }: PricingFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updatePricingAction,
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Prijsstrategie */}
      <Card>
        <CardHeader>
          <CardTitle>Prijsstrategie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strategy">Berekeningswijze</Label>
            <select
              id="strategy"
              name="strategy"
              defaultValue={settings.strategy}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="PER_NIGHT">Prijs per nacht</option>
              <option value="FIXED_PER_STAY">Vaste prijs per verblijf</option>
            </select>
            <FieldError errors={state?.errors?.strategy} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrice">Basisprijs (&euro;)</Label>
            <Input
              id="basePrice"
              name="basePrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.basePrice}
            />
            <FieldError errors={state?.errors?.basePrice} />
            <p className="text-xs text-neutral-500">
              {settings.strategy === "PER_NIGHT"
                ? "Prijs per nacht exclusief bijkomende kosten"
                : "Vaste prijs per verblijf exclusief bijkomende kosten"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bijkomende kosten */}
      <Card>
        <CardHeader>
          <CardTitle>Bijkomende kosten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cleaningFee">Schoonmaakkosten (&euro;)</Label>
            <Input
              id="cleaningFee"
              name="cleaningFee"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.cleaningFee}
            />
            <FieldError errors={state?.errors?.cleaningFee} />
            <p className="text-xs text-neutral-500">
              Eenmalige kosten per reservering
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositAmount">Borgsom (&euro;)</Label>
            <Input
              id="depositAmount"
              name="depositAmount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.depositAmount}
            />
            <FieldError errors={state?.errors?.depositAmount} />
            <p className="text-xs text-neutral-500">
              Borg die apart in rekening wordt gebracht
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {state?.message && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.message}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Prijsinstellingen opgeslagen
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Opslaan..." : "Opslaan"}
      </Button>
    </form>
  );
}
