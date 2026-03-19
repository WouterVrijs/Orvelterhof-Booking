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

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  MANUAL: "Handmatig",
  MAINTENANCE: "Onderhoud",
  OWNER: "Eigen gebruik",
  OTHER: "Overig",
};
