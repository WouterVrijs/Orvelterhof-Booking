"use client";

import { useState, useActionState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PaymentStatusBadge } from "@/components/shared/payment-status-badge";
import { Plus, Trash2 } from "lucide-react";
import {
  registerPaymentAction,
  deletePaymentAction,
  type PaymentActionState,
} from "@/lib/actions/payment-actions";
import { PAYMENT_METHOD_LABELS, type PaymentStatus, type PaymentMethod } from "@/lib/types";

interface PaymentData {
  id: string;
  amount: string;
  method: string;
  description: string | null;
  paidAt: string;
  createdAt: Date;
}

interface PaymentCardProps {
  reservationId: string;
  totalPrice: string | null;
  amountPaid: string;
  paymentStatus: string;
  payments: PaymentData[];
}

function formatEuro(amount: string | number | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

export function PaymentCard({
  reservationId,
  totalPrice,
  amountPaid,
  paymentStatus,
  payments,
}: PaymentCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [state, formAction, isSubmitting] = useActionState<
    PaymentActionState,
    FormData
  >(async (prevState, formData) => {
    const result = await registerPaymentAction(prevState, formData);
    if (result?.success) {
      setShowForm(false);
    }
    return result;
  }, null);

  const outstanding =
    parseFloat(totalPrice || "0") - parseFloat(amountPaid || "0");

  function handleDelete(paymentId: string) {
    if (!confirm("Weet je zeker dat je deze betaling wilt verwijderen?")) return;
    startTransition(async () => {
      await deletePaymentAction(paymentId, reservationId);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Betalingen</CardTitle>
        <PaymentStatusBadge status={paymentStatus as PaymentStatus} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-neutral-50 p-3">
          <div>
            <p className="text-xs text-neutral-500">Totaalprijs</p>
            <p className="text-sm font-medium">{formatEuro(totalPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Ontvangen</p>
            <p className="text-sm font-medium">{formatEuro(amountPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Openstaand</p>
            <p className="text-sm font-medium">
              {formatEuro(Math.max(0, outstanding))}
            </p>
          </div>
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded border border-neutral-100 p-3 text-sm"
              >
                <div>
                  <span className="font-medium">
                    {formatEuro(payment.amount)}
                  </span>
                  <span className="mx-2 text-neutral-400">·</span>
                  <span className="text-neutral-500">
                    {PAYMENT_METHOD_LABELS[payment.method as PaymentMethod] ??
                      payment.method}
                  </span>
                  <span className="mx-2 text-neutral-400">·</span>
                  <span className="text-neutral-500">{payment.paidAt}</span>
                  {payment.description && (
                    <>
                      <span className="mx-2 text-neutral-400">·</span>
                      <span className="text-neutral-400">
                        {payment.description}
                      </span>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(payment.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add payment form */}
        {showForm ? (
          <form action={formAction} className="space-y-3 rounded-lg border border-neutral-200 p-4">
            <input type="hidden" name="reservationId" value={reservationId} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="amount" className="text-xs">
                  Bedrag
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={outstanding > 0 ? outstanding.toFixed(2) : ""}
                />
                {state?.errors?.amount && (
                  <p className="text-xs text-red-600">{state.errors.amount[0]}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="paidAt" className="text-xs">
                  Datum
                </Label>
                <Input
                  id="paidAt"
                  name="paidAt"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="method" className="text-xs">
                  Methode
                </Label>
                <Select id="method" name="method" defaultValue="BANK_TRANSFER">
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs">
                  Omschrijving
                </Label>
                <Input id="description" name="description" />
              </div>
            </div>
            {state?.message && (
              <p className="text-xs text-red-600">{state.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setShowForm(false)}
              >
                Annuleren
              </Button>
              <Button type="submit" className="h-8 text-xs" disabled={isSubmitting}>
                {isSubmitting ? "Opslaan..." : "Betaling registreren"}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4" />
            Betaling registreren
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
