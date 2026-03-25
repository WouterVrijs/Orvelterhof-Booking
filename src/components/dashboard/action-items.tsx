import Link from "next/link";
import {
  AlertTriangle,
  CreditCard,
  LogIn,
  LogOut as LogOutIcon,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ActionItem } from "@/lib/services/dashboard";

const ICON_MAP: Record<ActionItem["type"], React.ReactNode> = {
  review: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  payment: <CreditCard className="h-4 w-4 text-red-500" />,
  arrival_today: <LogIn className="h-4 w-4 text-green-600" />,
  departure_today: <LogOutIcon className="h-4 w-4 text-purple-600" />,
  arrival_tomorrow: <Clock className="h-4 w-4 text-blue-600" />,
};

const COLOR_MAP: Record<ActionItem["type"], string> = {
  review: "border-l-amber-500",
  payment: "border-l-red-400",
  arrival_today: "border-l-green-500",
  departure_today: "border-l-purple-500",
  arrival_tomorrow: "border-l-blue-500",
};

export function ActionItems({ items }: { items: ActionItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Actie vereist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.type} href={item.href}>
              <div
                className={`flex items-center gap-3 rounded-lg border border-l-4 bg-white p-3 transition-colors hover:bg-neutral-50 ${COLOR_MAP[item.type]}`}
              >
                {ICON_MAP[item.type]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {item.label}
                  </p>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
                  {item.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
