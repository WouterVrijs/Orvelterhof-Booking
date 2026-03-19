import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@/lib/types";

const STATUS_VARIANT: Record<
  ReservationStatus,
  { label: string; variant: "info" | "warning" | "success" | "danger" }
> = {
  NEW: { label: "Nieuw", variant: "info" },
  IN_PROGRESS: { label: "In behandeling", variant: "warning" },
  CONFIRMED: { label: "Bevestigd", variant: "success" },
  CANCELLED: { label: "Geannuleerd", variant: "danger" },
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const config = STATUS_VARIANT[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
