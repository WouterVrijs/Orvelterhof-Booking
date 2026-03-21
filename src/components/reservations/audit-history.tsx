import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dates";
import type { AuditLog } from "@/lib/db/schema";

interface AuditHistoryProps {
  logs: AuditLog[];
}

export function AuditHistory({ logs }: AuditHistoryProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">Geen activiteit gelogd</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activiteit</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
            >
              <p className="text-sm text-neutral-700">{log.description}</p>
              <span className="ml-4 shrink-0 text-xs text-neutral-400">
                {formatDate(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
