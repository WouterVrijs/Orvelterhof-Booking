"use client";

import { useState, useActionState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSpecialArrangementAction,
  updateSpecialArrangementAction,
  deleteSpecialArrangementAction,
  type ActionState,
} from "@/lib/actions/special-arrangement-actions";
import type { SpecialArrangement } from "@/lib/db/schema";

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(amount);
}

interface SpecialArrangementsListProps {
  year: number;
  arrangements: SpecialArrangement[];
}

export function SpecialArrangementsList({
  year,
  arrangements,
}: SpecialArrangementsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      await deleteSpecialArrangementAction(id);
      setDeletingId(null);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Speciale arrangementen {year}</CardTitle>
        {!showForm && !editingId && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Toevoegen
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-lg border border-neutral-200 p-4">
            <h3 className="mb-3 text-sm font-medium">Nieuw arrangement</h3>
            <ArrangementForm
              year={year}
              onCancel={() => setShowForm(false)}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        )}

        {arrangements.length === 0 && !showForm ? (
          <p className="py-4 text-center text-sm text-neutral-500">
            Geen speciale arrangementen voor {year}
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {arrangements.map((arr) => (
              <div key={arr.id} className="py-3 first:pt-0 last:pb-0">
                {editingId === arr.id ? (
                  <div className="rounded-lg border border-neutral-200 p-4">
                    <ArrangementForm
                      year={year}
                      arrangement={arr}
                      onCancel={() => setEditingId(null)}
                      onSuccess={() => setEditingId(null)}
                    />
                  </div>
                ) : deletingId === arr.id ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="mb-3 text-sm text-red-700">
                      Weet je zeker dat je &quot;{arr.name}&quot; wilt
                      verwijderen?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingId(null)}
                      >
                        Annuleren
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(arr.id)}
                        disabled={isDeleting}
                      >
                        Verwijderen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-neutral-900">
                        {arr.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {arr.startDate} – {arr.endDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-medium ${
                          arr.isBooked
                            ? "italic text-neutral-400"
                            : "text-neutral-900"
                        }`}
                      >
                        {arr.isBooked
                          ? "Reeds verhuurd"
                          : arr.price
                            ? formatEuro(parseFloat(arr.price))
                            : "—"}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingId(arr.id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600"
                          onClick={() => setDeletingId(arr.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Inline form ---

function ArrangementForm({
  year,
  arrangement,
  onCancel,
  onSuccess,
}: {
  year: number;
  arrangement?: SpecialArrangement;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!arrangement;
  const action = isEditing
    ? updateSpecialArrangementAction
    : createSpecialArrangementAction;

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (result?.success) onSuccess();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="year" value={year} />
      {isEditing && (
        <input type="hidden" name="id" value={arrangement.id} />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Naam</Label>
          <Input
            name="name"
            required
            defaultValue={arrangement?.name ?? ""}
            placeholder="Bijv. Pasen"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Prijs (&euro;)</Label>
          <Input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={arrangement?.price ?? ""}
            placeholder="Leeg = op aanvraag"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Startdatum</Label>
          <Input
            name="startDate"
            type="date"
            required
            defaultValue={arrangement?.startDate ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Einddatum</Label>
          <Input
            name="endDate"
            type="date"
            required
            defaultValue={arrangement?.endDate ?? ""}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isBooked"
          defaultChecked={arrangement?.isBooked ?? false}
          className="rounded"
        />
        Reeds verhuurd
      </label>

      <input type="hidden" name="sortOrder" value={arrangement?.sortOrder ?? 0} />

      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Opslaan..." : isEditing ? "Bijwerken" : "Toevoegen"}
        </Button>
      </div>
    </form>
  );
}
