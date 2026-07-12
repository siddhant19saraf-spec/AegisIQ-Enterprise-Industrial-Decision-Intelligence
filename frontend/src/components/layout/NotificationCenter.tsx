"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Info, AlertTriangle, AlertCircle, Check,
  Inbox, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const DEMO_NOTIFICATIONS: (Notification & { priority?: "low" | "medium" | "high"; category?: string })[] = [
  { id: "1", type: "warning", priority: "high", category: "alerts", title: "High temperature on Turbine #7", body: "Temperature exceeded threshold of 95°C on Turbine #7 in Building A.", read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
  { id: "2", type: "alert", priority: "high", category: "incidents", title: "Critical incident reported", body: "Cooling system failure detected on Server Rack #4.", read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: "3", type: "warning", priority: "medium", category: "maintenance", title: "Maintenance scheduled", body: "Routine maintenance for Pump #3 at 14:00.", read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: "4", type: "info", priority: "low", category: "system", title: "System update available", body: "Version 0.2.0 is ready for deployment.", read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: "5", type: "success", priority: "low", category: "incidents", title: "Incident resolved", body: "Incident #1042 has been marked as resolved.", read_at: new Date().toISOString(), created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
];

const iconMap = { alert: AlertCircle, warning: AlertTriangle, info: Info, success: Check };
const colorMap = { alert: "text-red-500", warning: "text-amber-500", info: "text-blue-500", success: "text-emerald-500" };
function timeAgo(date: string) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export function NotificationCenter() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread" | "high">("all");
  const [notifications] = useState(DEMO_NOTIFICATIONS);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const unread = notifications.filter((n) => !n.read_at && !readIds.has(n.id)).length;
  const highPriority = notifications.filter((n) => n.priority === "high").length;

  const filtered = useMemo(() => {
    let items = notifications;
    if (filter === "unread") items = items.filter((n) => !n.read_at && !readIds.has(n.id));
    if (filter === "high") items = items.filter((n) => n.priority === "high");
    return items;
  }, [filter, notifications, readIds]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }, [notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Notifications</span>
            {highPriority > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <ShieldAlert className="h-3 w-3" />
                {highPriority} urgent
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                <Check className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex gap-1 border-b px-2 py-1">
          {(["all", "unread", "high"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f === "all" ? "All" : f === "unread" ? "Unread" : "High Priority"}
            </button>
          ))}
        </div>
        <DropdownMenuGroup className="max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Inbox className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            filtered.map((n) => {
              const Icon = iconMap[n.type];
              const isRead = !!n.read_at || readIds.has(n.id);
              return (
                <DropdownMenuItem
                  key={n.id}
                  className={cn("flex items-start gap-3 px-3 py-2.5", isRead && "opacity-60")}
                  onSelect={(e) => { e.preventDefault(); markRead(n.id); }}
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", colorMap[n.type])} />
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm truncate", isRead ? "font-normal" : "font-semibold")}>{n.title}</p>
                      {n.priority === "high" && !isRead && (
                        <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                      <span>{timeAgo(n.created_at)}</span>
                      {n.category && (
                        <>
                          <span>·</span>
                          <span className="capitalize">{n.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!isRead && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-sm text-muted-foreground"
          onSelect={() => router.push("/notifications")}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
