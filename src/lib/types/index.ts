// Enums — will be expanded as modules are built with Drizzle
export type ReservationStatus = "NEW" | "IN_PROGRESS" | "CONFIRMED" | "CANCELLED";
export type ReservationSource = "WEBSITE" | "MANUAL" | "PHONE" | "EMAIL";
export type BlockType = "MANUAL" | "MAINTENANCE" | "OWNER" | "OTHER";

export const RESERVATION_STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; color: string }
> = {
  NEW: { label: "Nieuw", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "In behandeling", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Bevestigd", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Geannuleerd", color: "bg-red-100 text-red-800" },
};

export const RESERVATION_SOURCE_LABELS: Record<ReservationSource, string> = {
  WEBSITE: "Website",
  MANUAL: "Handmatig",
  PHONE: "Telefoon",
  EMAIL: "E-mail",
};

// Allowed status transitions: current status → allowed next statuses
export const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  NEW: ["IN_PROGRESS", "CONFIRMED", "CANCELLED"],
  IN_PROGRESS: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  CANCELLED: [],
};

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  MANUAL: "Handmatig",
  MAINTENANCE: "Onderhoud",
  OWNER: "Eigen gebruik",
  OTHER: "Overig",
};

// Payment types
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";
export type PaymentMethod = "BANK_TRANSFER" | "CASH" | "IDEAL" | "CREDITCARD" | "MOLLIE" | "OTHER";

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: "info" | "warning" | "success" | "danger" }
> = {
  UNPAID: { label: "Onbetaald", variant: "danger" },
  PARTIAL: { label: "Aanbetaald", variant: "warning" },
  PAID: { label: "Betaald", variant: "success" },
  REFUNDED: { label: "Terugbetaald", variant: "info" },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Bankoverschrijving",
  CASH: "Contant",
  IDEAL: "iDEAL",
  CREDITCARD: "Creditcard",
  MOLLIE: "Mollie",
  OTHER: "Overig",
};
