import Link from "next/link";
import { Bell, AlertCircle, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Notification } from "@/lib/services/dashboard";

const STYLES: Record<Notification["type"], { icon: React.ReactNode; bg: string; text: string }> = {
  urgent: {
    icon: <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />,
    bg: "bg-red-50",
    text: "text-red-800",
  },
  warning: {
    icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />,
    bg: "bg-amber-50",
    text: "text-amber-800",
  },
  info: {
    icon: <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />,
    bg: "bg-blue-50",
    text: "text-blue-800",
  },
};

export function Notifications({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Meldingen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notifications.map((notification, i) => {
            const style = STYLES[notification.type];
            const content = (
              <div
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${style.bg} ${style.text}`}
              >
                {style.icon}
                <span>{notification.message}</span>
              </div>
            );

            if (notification.href) {
              return (
                <Link key={i} href={notification.href} className="block transition-opacity hover:opacity-80">
                  {content}
                </Link>
              );
            }
            return <div key={i}>{content}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
