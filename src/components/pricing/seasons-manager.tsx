"use client";

import { useState, useActionState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSeasonAction,
  deleteSeasonAction,
  upsertStayTypePriceAction,
  type ActionState,
} from "@/lib/actions/season-actions";
import type { Season, StayTypePrice } from "@/lib/db/schema";

const STAY_TYPES = [
  { type: "WEEKEND" as const, label: "Weekend", defaultNights: 2 },
  { type: "LONG_WEEKEND" as const, label: "Lang weekend", defaultNights: 3 },
  { type: "MIDWEEK" as const, label: "Midweek", defaultNights: 4 },
  { type: "WEEK" as const, label: "Week", defaultNights: 7 },
];

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(amount);
}

interface SeasonsManagerProps {
  year: number;
  seasonRows: Season[];
  prices: StayTypePrice[];
}

export function SeasonsManager({
  year,
  seasonRows,
  prices,
}: SeasonsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Group seasons by name
  const grouped = new Map<string, Season[]>();
  for (const s of seasonRows) {
    const list = grouped.get(s.name) || [];
    list.push(s);
    grouped.set(s.name, list);
  }

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      await deleteSeasonAction(id);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Seizoenen {year}</CardTitle>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Periode toevoegen
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <div className="rounded-lg border border-neutral-200 p-4">
            <h3 className="mb-3 text-sm font-medium">Nieuwe seizoensperiode</h3>
            <SeasonForm
              year={year}
              onCancel={() => setShowForm(false)}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        )}

        {Array.from(grouped.entries()).map(([name, rows]) => {
          const seasonPrices = prices.filter((p) =>
            rows.some((r) => r.id === p.seasonId)
          );
          // Use the first row's ID for price upserts
          const primarySeasonId = rows[0].id;

          return (
            <div key={name} className="rounded-lg border border-neutral-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900">
                    {name}
                  </h3>
                  <div className="mt-1 space-y-0.5">
                    {rows.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-2 text-xs text-neutral-500"
                      >
                        <span>
                          {r.startDate} t/m {r.endDate}
                        </span>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={isDeleting}
                          className="text-red-400 hover:text-red-600"
                          title="Verwijder datumbereik"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stay type prices */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STAY_TYPES.map((st) => {
                  const existing = seasonPrices.find(
                    (p) => p.stayType === st.type
                  );
                  return (
                    <StayTypePriceInput
                      key={st.type}
                      seasonId={primarySeasonId}
                      stayType={st.type}
                      label={st.label}
                      nights={st.defaultNights}
                      currentPrice={
                        existing ? parseFloat(existing.price) : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {grouped.size === 0 && !showForm && (
          <p className="py-4 text-center text-sm text-neutral-500">
            Nog geen seizoenen geconfigureerd voor {year}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// --- Season form ---

function SeasonForm({
  year,
  onCancel,
  onSuccess,
}: {
  year: number;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await createSeasonAction(prev, formData);
      if (result?.success) onSuccess();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="year" value={year} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Naam</Label>
          <Input name="name" required placeholder="Bijv. Periode 1" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Startdatum</Label>
          <Input name="startDate" type="date" required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Einddatum</Label>
          <Input name="endDate" type="date" required />
        </div>
      </div>
      <input type="hidden" name="sortOrder" value="0" />
      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Opslaan..." : "Toevoegen"}
        </Button>
      </div>
    </form>
  );
}

// --- Stay type price input ---

function StayTypePriceInput({
  seasonId,
  stayType,
  label,
  nights,
  currentPrice,
}: {
  seasonId: string;
  stayType: string;
  label: string;
  nights: number;
  currentPrice?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value === currentPrice) return;

    setSaved(false);
    const formData = new FormData();
    formData.set("seasonId", seasonId);
    formData.set("stayType", stayType);
    formData.set("nights", nights.toString());
    formData.set("price", value.toString());

    startTransition(async () => {
      await upsertStayTypePriceAction(null, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-1">
      <label className="text-[11px] text-neutral-500">
        {label} ({nights}n)
      </label>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
          €
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          defaultValue={currentPrice ?? ""}
          onBlur={handleBlur}
          disabled={isPending}
          placeholder="—"
          className="h-8 w-full rounded-md border border-input bg-background pl-6 pr-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {saved && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-green-600">
            ✓
          </span>
        )}
      </div>
    </div>
  );
}
