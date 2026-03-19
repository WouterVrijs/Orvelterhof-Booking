"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createBlockedPeriodAction,
  updateBlockedPeriodAction,
  type ActionState,
} from "@/lib/actions/blocked-period-actions";
import { BLOCK_TYPE_LABELS, type BlockType } from "@/lib/types";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return <p className="text-sm text-red-600">{errors[0]}</p>;
}

interface BlockedPeriodFormProps {
  period?: {
    id: string;
    startDate: string;
    endDate: string;
    reason: string | null;
    blockType: string;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

export function BlockedPeriodForm({
  period,
  onCancel,
  onSuccess,
}: BlockedPeriodFormProps) {
  const isEditing = !!period;

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const action = isEditing
        ? updateBlockedPeriodAction
        : createBlockedPeriodAction;
      const result = await action(prevState, formData);
      if (result?.success) {
        onSuccess();
      }
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {isEditing && <input type="hidden" name="id" value={period.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Startdatum</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={period?.startDate ?? ""}
          />
          <FieldError errors={state?.errors?.startDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Einddatum</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={period?.endDate ?? ""}
          />
          <FieldError errors={state?.errors?.endDate} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="blockType">Type</Label>
        <select
          id="blockType"
          name="blockType"
          defaultValue={period?.blockType ?? "MANUAL"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {(Object.entries(BLOCK_TYPE_LABELS) as [BlockType, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reden (optioneel)</Label>
        <Textarea
          id="reason"
          name="reason"
          rows={2}
          placeholder="Bijv. onderhoud badkamer, eigen verblijf..."
          defaultValue={period?.reason ?? ""}
        />
      </div>

      {state?.message && (
        <div
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.message}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Opslaan..."
            : isEditing
              ? "Wijzigingen opslaan"
              : "Periode blokkeren"}
        </Button>
      </div>
    </form>
  );
}
