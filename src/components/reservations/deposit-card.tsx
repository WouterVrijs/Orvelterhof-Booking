"use client";

import { useState, useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import {
  registerDepositAction,
  returnDepositAction,
  type DepositActionState,
} from "@/lib/actions/deposit-actions";
import {
  DEPOSIT_STATUS_CONFIG,
  PAYMENT_METHOD_LABELS,
  type DepositStatus,
} from "@/lib/types";

interface DepositCardProps {
  reservationId: string;
  depositAmount: string;
  depositStatus: string;
  depositReceivedAt: string | null;
  depositReturnedAt: string | null;
  depositReturnedAmount: string | null;
  depositRetentionReason: string | null;
}

function formatEuro(amount: string | number | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

export function DepositCard({
  reservationId,
  depositAmount,
  depositStatus,
  depositReceivedAt,
  depositReturnedAt,
  depositReturnedAmount,
  depositRetentionReason,
}: DepositCardProps) {
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);

  const [receiveState, receiveAction, isReceiving] = useActionState<
    DepositActionState,
    FormData
  >(async (prevState, formData) => {
    const result = await registerDepositAction(prevState, formData);
    if (result?.success) setShowReceiveForm(false);
    return result;
  }, null);

  const [returnState, returnAction, isReturning] = useActionState<
    DepositActionState,
    FormData
  >(async (prevState, formData) => {
    const result = await returnDepositAction(prevState, formData);
    if (result?.success) setShowReturnForm(false);
    return result;
  }, null);

  const config = DEPOSIT_STATUS_CONFIG[depositStatus as DepositStatus];
  const amount = parseFloat(depositAmount);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Borgsom
        </CardTitle>
        {amount > 0 && config && (
          <Badge variant={config.variant}>{config.label}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary when deposit exists */}
        {amount > 0 && (
          <div className="rounded-lg bg-neutral-50 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Borgsom</span>
              <span className="font-medium">{formatEuro(depositAmount)}</span>
            </div>
            {depositReceivedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Ontvangen op</span>
                <span>{depositReceivedAt}</span>
              </div>
            )}
            {depositReturnedAt && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Terugbetaald</span>
                  <span className="font-medium">
                    {formatEuro(depositReturnedAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Datum</span>
                  <span>{depositReturnedAt}</span>
                </div>
              </>
            )}
            {depositRetentionReason && (
              <div className="text-sm">
                <span className="text-neutral-500">Reden inhouding: </span>
                <span>{depositRetentionReason}</span>
              </div>
            )}
          </div>
        )}

        {/* Receive deposit form */}
        {depositStatus === "PENDING" && (
          <>
            {showReceiveForm ? (
              <form action={receiveAction} className="space-y-3 rounded-lg border p-4">
                <input type="hidden" name="reservationId" value={reservationId} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Bedrag</Label>
                    <Input name="amount" type="number" step="0.01" min="0.01" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Datum ontvangen</Label>
                    <Input
                      name="receivedAt"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Methode</Label>
                  <Select name="method" defaultValue="BANK_TRANSFER">
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </div>
                {receiveState?.message && (
                  <p className="text-xs text-red-600">{receiveState.message}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => setShowReceiveForm(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" className="h-8 text-xs" disabled={isReceiving}>
                    {isReceiving ? "Opslaan..." : "Borgsom ontvangen"}
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowReceiveForm(true)}>
                Borgsom ontvangen registreren
              </Button>
            )}
          </>
        )}

        {/* Return deposit form */}
        {depositStatus === "RECEIVED" && (
          <>
            {showReturnForm ? (
              <form action={returnAction} className="space-y-3 rounded-lg border p-4">
                <input type="hidden" name="reservationId" value={reservationId} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Terug te betalen bedrag</Label>
                    <Input
                      name="returnedAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={depositAmount}
                    />
                    <p className="text-xs text-neutral-400">
                      Vul 0 in om volledig in te houden
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Datum</Label>
                    <Input
                      name="returnedAt"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reden inhouding (optioneel)</Label>
                  <Textarea name="retentionReason" rows={2} placeholder="Bijv. schade, extra schoonmaak" />
                </div>
                {returnState?.message && (
                  <p className="text-xs text-red-600">{returnState.message}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => setShowReturnForm(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" className="h-8 text-xs" disabled={isReturning}>
                    {isReturning ? "Verwerken..." : "Borgsom terugbetalen"}
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowReturnForm(true)}>
                Borgsom terugbetalen
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
