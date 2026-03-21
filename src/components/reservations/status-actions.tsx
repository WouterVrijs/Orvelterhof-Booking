"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  updateReservationStatusAction,
  cancelReservationAction,
} from "@/lib/actions/reservation-actions";
import {
  ALLOWED_TRANSITIONS,
  RESERVATION_STATUS_CONFIG,
  type ReservationStatus,
} from "@/lib/types";

interface StatusActionsProps {
  reservationId: string;
  currentStatus: ReservationStatus;
}

export function StatusActions({
  reservationId,
  currentStatus,
}: StatusActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus];

  if (allowedNext.length === 0) return null;

  function handleStatusChange(newStatus: ReservationStatus) {
    if (newStatus === "CANCELLED") {
      setShowCancelDialog(true);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateReservationStatusAction(
        reservationId,
        newStatus
      );
      if (result?.message) {
        setError(result.message);
      }
    });
  }

  function handleConfirmCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelReservationAction(
        reservationId,
        cancelReason.trim() || undefined
      );
      if (result?.message) {
        setError(result.message);
      } else {
        setShowCancelDialog(false);
        setCancelReason("");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status wijzigen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showCancelDialog ? (
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              Weet je zeker dat je deze reservering wilt annuleren?
              {currentStatus === "CONFIRMED" &&
                " De periode wordt weer beschikbaar."}
            </p>
            <div className="space-y-2">
              <Label htmlFor="cancelReason" className="text-sm text-red-700">
                Reden (optioneel)
              </Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Bijv. gast heeft geannuleerd, dubbele boeking..."
                rows={2}
                className="bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason("");
                }}
                disabled={isPending}
              >
                Terug
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={isPending}
              >
                {isPending ? "Annuleren..." : "Reservering annuleren"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allowedNext.map((status) => {
              const config = RESERVATION_STATUS_CONFIG[status];
              return (
                <Button
                  key={status}
                  variant={status === "CANCELLED" ? "destructive" : "outline"}
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleStatusChange(status)}
                >
                  {isPending ? "Bezig..." : config.label}
                </Button>
              );
            })}
          </div>
        )}

        {error && (
          <div
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
