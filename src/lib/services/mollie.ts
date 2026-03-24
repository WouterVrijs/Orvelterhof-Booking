import createMollieClient, { type MollieClient, type Payment } from "@mollie/api-client";

// --- Client ---

let client: MollieClient | null = null;

function getMollieClient(): MollieClient {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) throw new Error("MOLLIE_API_KEY is not configured");
  if (!client) {
    client = createMollieClient({ apiKey });
  }
  return client;
}

export function isMollieConfigured(): boolean {
  return !!process.env.MOLLIE_API_KEY;
}

// --- Create payment ---

interface CreatePaymentParams {
  reservationId: string;
  reservationNumber: string;
  amount: number;
  description: string;
  redirectUrl: string;
}

export async function createMolliePayment({
  reservationId,
  reservationNumber,
  amount,
  description,
  redirectUrl,
}: CreatePaymentParams): Promise<{ paymentId: string; checkoutUrl: string }> {
  const mollie = getMollieClient();
  const webhookUrl = `${getAppUrl()}/api/webhooks/mollie`;

  const payment = await mollie.payments.create({
    amount: {
      currency: "EUR",
      value: amount.toFixed(2),
    },
    description,
    redirectUrl,
    webhookUrl,
    metadata: {
      reservationId,
      reservationNumber,
    },
  });

  if (!payment.getCheckoutUrl()) {
    throw new Error("Mollie payment created but no checkout URL returned");
  }

  return {
    paymentId: payment.id,
    checkoutUrl: payment.getCheckoutUrl()!,
  };
}

// --- Get payment status ---

export async function getMolliePayment(paymentId: string): Promise<Payment> {
  const mollie = getMollieClient();
  return mollie.payments.get(paymentId);
}

// --- Create refund ---

interface CreateRefundParams {
  paymentId: string;
  amount: number;
  description?: string;
}

export async function createMollieRefund({
  paymentId,
  amount,
  description,
}: CreateRefundParams): Promise<string> {
  const mollie = getMollieClient();
  const refund = await mollie.paymentRefunds.create({
    paymentId,
    amount: {
      currency: "EUR",
      value: amount.toFixed(2),
    },
    ...(description && { description }),
  });

  return refund.id;
}

// --- Helpers ---

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";
}
