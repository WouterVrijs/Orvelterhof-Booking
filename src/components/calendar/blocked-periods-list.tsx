"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlockedPeriodForm } from "@/components/calendar/blocked-period-form";
import { deleteBlockedPeriodAction } from "@/lib/actions/blocked-period-actions";
import { formatDate } from "@/lib/utils/dates";
import { BLOCK_TYPE_LABELS, type BlockType } from "@/lib/types";

interface BlockedPeriodData {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  blockType: string;
}

interface BlockedPeriodsListProps {
  periods: BlockedPeriodData[];
}

export function BlockedPeriodsList({ periods }: BlockedPeriodsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      await deleteBlockedPeriodAction(id);
      setDeletingId(null);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Geblokkeerde periodes</CardTitle>
        {!showForm && !editingId && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Periode blokkeren
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create form */}
        {showForm && (
          <div className="rounded-lg border border-neutral-200 p-4">
            <h3 className="mb-3 text-sm font-medium">
              Nieuwe geblokkeerde periode
            </h3>
            <BlockedPeriodForm
              onCancel={() => setShowForm(false)}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        )}

        {/* List */}
        {periods.length === 0 && !showForm ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <ShieldAlert className="h-8 w-8 text-neutral-300" />
            <p className="text-sm text-neutral-500">
              Geen geblokkeerde periodes
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {periods.map((period) => (
              <div key={period.id} className="py-3 first:pt-0 last:pb-0">
                {editingId === period.id ? (
                  <div className="rounded-lg border border-neutral-200 p-4">
                    <h3 className="mb-3 text-sm font-medium">
                      Periode bewerken
                    </h3>
                    <BlockedPeriodForm
                      period={period}
                      onCancel={() => setEditingId(null)}
                      onSuccess={() => setEditingId(null)}
                    />
                  </div>
                ) : deletingId === period.id ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="mb-3 text-sm text-red-700">
                      Weet je zeker dat je deze geblokkeerde periode wilt
                      verwijderen? De datums worden weer beschikbaar.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingId(null)}
                        disabled={isDeleting}
                      >
                        Annuleren
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(period.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Verwijderen..." : "Verwijderen"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-neutral-900">
                        {formatDate(period.startDate)} –{" "}
                        {formatDate(period.endDate)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {BLOCK_TYPE_LABELS[period.blockType as BlockType] ??
                          period.blockType}
                        {period.reason && ` · ${period.reason}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingId(period.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => setDeletingId(period.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
