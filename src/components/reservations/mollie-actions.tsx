"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Send, RotateCcw, ExternalLink, Copy } from "lucide-react";
import {
  createPaymentLinkAction,
  sendPaymentLinkAction,
  refundPaymentAction,
} from "@/lib/actions/mollie-actions";

interface MollieActionsProps {
  reservationId: string;
  totalPrice: string | null;
  amountPaid: string;
  paymentStatus: string;
  isMollieEnabled: boolean;
}

export function MollieActions({
  reservationId,
  totalPrice,
  amountPaid,
  paymentStatus,
  isMollieEnabled,
}: MollieActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

  if (!isMollieEnabled) return null;

  const outstanding =
    parseFloat(totalPrice || "0") - parseFloat(amountPaid || "0");

  function handleCreateLink() {
    if (outstanding <= 0) return;
    startTransition(async () => {
      const result = await createPaymentLinkAction(reservationId, outstanding);
      if (result?.checkoutUrl) {
        setCheckoutUrl(result.checkoutUrl);
        setMessage(null);
      }
      if (result?.message) setMessage(result.message);
    });
  }

  function handleSendEmail() {
    if (outstanding <= 0) return;
    startTransition(async () => {
      const result = await sendPaymentLinkAction(reservationId, outstanding);
      if (result?.success) {
        setCheckoutUrl(result.checkoutUrl || null);
        setMessage(result.message || "Betaallink verstuurd naar gast");
        setTimeout(() => setMessage(null), 5000);
      } else if (result?.message) {
        setMessage(result.message);
      }
    });
  }

  function handleRefund() {
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) return;
    startTransition(async () => {
      const result = await refundPaymentAction(reservationId, amount);
      if (result?.success) {
        setShowRefund(false);
        setRefundAmount("");
        setMessage("Terugbetaling geïnitieerd");
        setTimeout(() => setMessage(null), 5000);
      } else if (result?.message) {
        setMessage(result.message);
      }
    });
  }

  function copyToClipboard() {
    if (checkoutUrl) {
      navigator.clipboard.writeText(checkoutUrl);
      setMessage("Link gekopieerd");
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Mollie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status message */}
        {message && (
          <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {message}
          </div>
        )}

        {/* Payment link */}
        {checkoutUrl && (
          <div className="flex items-center gap-2 rounded-md border border-neutral-200 p-2">
            <input
              type="text"
              readOnly
              value={checkoutUrl}
              className="flex-1 truncate bg-transparent text-xs text-neutral-600"
            />
            <Button
              variant="outline"
              className="h-7 w-7 shrink-0 p-0"
              onClick={copyToClipboard}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="h-7 w-7 shrink-0 p-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        )}

        {/* Actions */}
        {outstanding > 0 && paymentStatus !== "PAID" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={handleCreateLink}
              disabled={isPending}
            >
              <CreditCard className="h-3 w-3" />
              Betaallink (€{outstanding.toFixed(2)})
            </Button>
            <Button
              className="flex-1 text-xs"
              onClick={handleSendEmail}
              disabled={isPending}
            >
              <Send className="h-3 w-3" />
              Verstuur naar gast
            </Button>
          </div>
        )}

        {/* Refund */}
        {paymentStatus === "PAID" && (
          <>
            {showRefund ? (
              <div className="space-y-2 rounded-md border border-neutral-200 p-3">
                <Label className="text-xs">Terugbetaling bedrag</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-8"
                  />
                  <Button
                    className="h-8 text-xs"
                    onClick={handleRefund}
                    disabled={isPending}
                  >
                    Terugbetalen
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => setShowRefund(false)}
                  >
                    Annuleren
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => setShowRefund(true)}
              >
                <RotateCcw className="h-3 w-3" />
                Terugbetaling via Mollie
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
