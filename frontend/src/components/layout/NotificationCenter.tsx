"use client";

import { useState } from "react";
import { Bell, Info, AlertTriangle, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "warning",
    title: "High temperature on Turbine #7",
    body: "Temperature exceeded threshold of 95°C",
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "2",
    type: "info",
    title: "Maintenance scheduled",
    body: "Routine maintenance for Pump #3 at 14:00",
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "3",
    type: "success",
    title: "Incident resolved",
    body: "Incident #1042 has been marked as resolved",
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

const iconMap = {
  alert: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: Check,
};

const colorMap = {
  alert: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
  success: "text-emerald-500",
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationCenter() {
  const [notifications] = useState(DEMO_NOTIFICATIONS);
  const unread = notifications.filter((n) => !n.read_at).length;

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
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 && (
            <span className="text-xs font-normal text-muted-foreground">{unread} unread</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((n) => {
              const Icon = iconMap[n.type];
              return (
                <DropdownMenuItem key={n.id} className="flex items-start gap-3 px-3 py-2.5" disabled={!!n.read_at}>
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", colorMap[n.type])} />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/60">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-sm text-muted-foreground">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
