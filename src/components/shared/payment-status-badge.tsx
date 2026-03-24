import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_CONFIG, type PaymentStatus } from "@/lib/types";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = PAYMENT_STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
