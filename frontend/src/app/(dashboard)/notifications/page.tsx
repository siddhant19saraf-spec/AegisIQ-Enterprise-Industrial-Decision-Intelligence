"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Search, Bell, Info, AlertTriangle, AlertCircle, Check,
  CheckCheck, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { notificationsApi, type NotificationItem } from "@/features/notifications/api/notifications";

const iconMap: Record<string, React.ElementType> = { alert: AlertCircle, warning: AlertTriangle, info: Info, success: Check };
const colorMap: Record<string, string> = { alert: "text-red-500", warning: "text-amber-500", info: "text-blue-500", success: "text-emerald-500" };
const priorityColors: Record<string, string> = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-blue-500" };

function timeAgo(date: string) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function getPriority(n: NotificationItem): "high" | "medium" | "low" {
  if (n.type === "alert") return "high";
  if (n.type === "warning") return "medium";
  return "low";
}

function getCategory(n: NotificationItem): string {
  const d = n.data as Record<string, unknown>;
  if (d.category) return String(d.category);
  if (n.title.toLowerCase().includes("incident")) return "incidents";
  if (n.title.toLowerCase().includes("maintenance")) return "maintenance";
  return "system";
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(1, 100),
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = data?.items ?? [];
  const unreadCount = items.filter((n) => !n.read).length;

  const visible = items
    .filter((n) => {
      if (tab === "unread") return !n.read;
      if (tab === "high") return getPriority(n) === "high";
      return true;
    })
    .filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.body ?? "").toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllReadMut.mutate()} disabled={markAllReadMut.isPending}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread {unreadCount > 0 && <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>}</TabsTrigger>
            <TabsTrigger value="high">
              High Priority
              <Badge variant="destructive" className="ml-1">{items.filter((n) => getPriority(n) === "high").length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-2">
        {visible.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No notifications found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try changing your filter or search term</p>
            </CardContent>
          </Card>
        ) : (
          visible.map((n) => {
            const Icon = iconMap[n.type] ?? Info;
            const priority = getPriority(n);
            const category = getCategory(n);
            return (
              <Card
                key={n.id}
                className={cn(
                  "transition-colors hover:bg-muted/30 cursor-pointer",
                  n.read ? "opacity-70" : "border-l-4 border-l-primary",
                )}
                onClick={() => { if (!n.read) markReadMut.mutate(n.id); }}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={cn("mt-1 rounded-full p-1.5", n.read ? "bg-muted" : "bg-muted/80")}>
                    <Icon className={cn("h-4 w-4", colorMap[n.type])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn("text-sm truncate", n.read ? "font-normal" : "font-semibold")}>{n.title}</p>
                      {priority === "high" && (
                        <Badge variant="destructive" className="text-[10px] h-5">URGENT</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] h-5 capitalize">{category}</Badge>
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/60">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(n.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn("h-2 w-2 rounded-full", priorityColors[priority])} />
                        <span className="capitalize">{priority} priority</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); markReadMut.mutate(n.id); }}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
