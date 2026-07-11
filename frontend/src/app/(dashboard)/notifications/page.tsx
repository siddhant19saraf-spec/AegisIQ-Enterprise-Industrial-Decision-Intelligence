import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Info, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
  { type: "warning", title: "High temperature on Turbine #7", time: "5m ago", icon: AlertTriangle, color: "text-amber-500" },
  { type: "info", title: "Maintenance scheduled for Pump #3", time: "30m ago", icon: Info, color: "text-blue-500" },
  { type: "success", title: "Incident #1042 resolved", time: "1h ago", icon: Check, color: "text-emerald-500" },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Stay informed about your operations" />
      <Card>
        <CardContent className="divide-y p-0">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.title} className="flex items-start gap-4 px-6 py-4">
                <Icon className={cn("mt-1 h-4 w-4 shrink-0", n.color)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.time}</p>
                </div>
                {n.type === "warning" && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
