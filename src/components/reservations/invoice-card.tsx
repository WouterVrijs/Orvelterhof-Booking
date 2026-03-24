"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, ExternalLink, Plus } from "lucide-react";
import {
  createInvoiceAction,
  sendInvoiceEmailAction,
} from "@/lib/actions/invoice-actions";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string;
  invoiceDate: string;
  sentAt: Date | null;
}

interface InvoiceCardProps {
  reservationId: string;
  invoice: InvoiceData | null;
}

function formatEuro(amount: string): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(parseFloat(amount));
}

const STATUS_CONFIG: Record<string, { label: string; variant: "info" | "warning" | "success" }> = {
  DRAFT: { label: "Concept", variant: "info" },
  SENT: { label: "Verstuurd", variant: "warning" },
  PAID: { label: "Betaald", variant: "success" },
};

export function InvoiceCard({ reservationId, invoice }: InvoiceCardProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleCreate() {
    startTransition(async () => {
      const result = await createInvoiceAction(reservationId);
      if (result?.message) setMessage(result.message);
      if (result?.success) {
        setMessage("Factuur aangemaakt");
        setTimeout(() => setMessage(null), 3000);
      }
    });
  }

  function handleSendEmail() {
    startTransition(async () => {
      const result = await sendInvoiceEmailAction(reservationId);
      if (result?.message) setMessage(result.message);
      if (result?.success) {
        setMessage("Factuur verstuurd per e-mail");
        setTimeout(() => setMessage(null), 3000);
      }
    });
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Factuur
        </CardTitle>
        {invoice && (
          <Badge variant={STATUS_CONFIG[invoice.status]?.variant || "info"}>
            {STATUS_CONFIG[invoice.status]?.label || invoice.status}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {message && (
          <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {message}
          </div>
        )}

        {invoice ? (
          <>
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-neutral-50 p-3">
              <div>
                <p className="text-xs text-neutral-500">Factuurnummer</p>
                <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Datum</p>
                <p className="text-sm font-medium">{invoice.invoiceDate}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Totaal</p>
                <p className="text-sm font-medium">{formatEuro(invoice.total)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full text-xs">
                  <ExternalLink className="h-3 w-3" />
                  Bekijken / PDF
                </Button>
              </a>
              <Button
                className="flex-1 text-xs"
                onClick={handleSendEmail}
                disabled={isPending}
              >
                <Send className="h-3 w-3" />
                Versturen naar gast
              </Button>
            </div>

            {invoice.sentAt && (
              <p className="text-xs text-neutral-400">
                Verstuurd op {new Date(invoice.sentAt).toLocaleDateString("nl-NL")}
              </p>
            )}
          </>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCreate}
            disabled={isPending}
          >
            <Plus className="h-4 w-4" />
            {isPending ? "Aanmaken..." : "Factuur aanmaken"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
