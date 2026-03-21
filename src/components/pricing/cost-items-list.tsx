"use client";

import { useState, useActionState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCostItemAction,
  updateCostItemAction,
  deleteCostItemAction,
  type ActionState,
} from "@/lib/actions/cost-item-actions";
import type { CostItem } from "@/lib/db/schema";

const TYPE_LABELS: Record<string, string> = {
  FIXED: "Vast bedrag",
  PER_PERSON: "Per persoon",
  PER_NIGHT: "Per nacht",
  PER_PERSON_PER_NIGHT: "Per persoon/nacht",
  PER_UNIT: "Per stuk",
};

const CATEGORY_LABELS: Record<string, string> = {
  BASE: "Basisprijs",
  MANDATORY: "Verplichte kosten",
  UPGRADE: "Optionele upgrade",
};

interface CostItemsListProps {
  items: CostItem[];
}

export function CostItemsList({ items }: CostItemsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const baseItems = items.filter((i) => i.category === "BASE");
  const mandatoryItems = items.filter((i) => i.category === "MANDATORY");
  const upgradeItems = items.filter((i) => i.category === "UPGRADE");

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      await deleteCostItemAction(id);
      setDeletingId(null);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Kostenposten</CardTitle>
        {!showForm && !editingId && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Toevoegen
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <div className="rounded-lg border border-neutral-200 p-4">
            <h3 className="mb-3 text-sm font-medium">Nieuwe kostenpost</h3>
            <CostItemForm
              onCancel={() => setShowForm(false)}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        )}

        {[
          { label: "Basisprijs", items: baseItems },
          { label: "Verplichte kosten", items: mandatoryItems },
          { label: "Optionele upgrades", items: upgradeItems },
        ].map(
          (group) =>
            group.items.length > 0 && (
              <div key={group.label}>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  {group.label}
                </h3>
                <div className="divide-y divide-neutral-100">
                  {group.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                      {editingId === item.id ? (
                        <div className="rounded-lg border border-neutral-200 p-4">
                          <CostItemForm
                            item={item}
                            onCancel={() => setEditingId(null)}
                            onSuccess={() => setEditingId(null)}
                          />
                        </div>
                      ) : deletingId === item.id ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                          <p className="mb-3 text-sm text-red-700">
                            Weet je zeker dat je &quot;{item.name}&quot; wilt
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
                              onClick={() => handleDelete(item.id)}
                              disabled={isDeleting}
                            >
                              Verwijderen
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-neutral-900">
                                {item.name}
                              </p>
                              {!item.isActive && (
                                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">
                                  Inactief
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500">
                              {TYPE_LABELS[item.type]} ·{" "}
                              {new Intl.NumberFormat("nl-NL", {
                                style: "currency",
                                currency: "EUR",
                              }).format(parseFloat(item.price))}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setEditingId(item.id)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => setDeletingId(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
        )}

        {items.length === 0 && !showForm && (
          <p className="py-4 text-center text-sm text-neutral-500">
            Nog geen kostenposten geconfigureerd
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// --- Inline form ---

function CostItemForm({
  item,
  onCancel,
  onSuccess,
}: {
  item?: CostItem;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!item;
  const action = isEditing ? updateCostItemAction : createCostItemAction;

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (result?.success) onSuccess();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {isEditing && <input type="hidden" name="id" value={item.id} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs">
            Naam
          </Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={item?.name ?? ""}
            placeholder="Bijv. Eindschoonmaak"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="price" className="text-xs">
            Prijs (&euro;)
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={item?.price ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="type" className="text-xs">
            Berekening
          </Label>
          <select
            id="type"
            name="type"
            defaultValue={item?.type ?? "FIXED"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="category" className="text-xs">
            Categorie
          </Label>
          <select
            id="category"
            name="category"
            defaultValue={item?.category ?? "MANDATORY"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="sortOrder" className="text-xs">
            Volgorde
          </Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={item?.sortOrder ?? 0}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={item?.isActive ?? true}
          className="rounded"
        />
        Actief
      </label>

      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Annuleren
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Opslaan..." : isEditing ? "Bijwerken" : "Toevoegen"}
        </Button>
      </div>
    </form>
  );
}
