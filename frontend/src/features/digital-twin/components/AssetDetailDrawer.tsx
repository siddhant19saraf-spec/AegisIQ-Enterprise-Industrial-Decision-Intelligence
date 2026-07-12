"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, Activity, Shield, Wrench } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { assetsApi } from "@/features/assets/api/assets";
import { decisionsApi } from "@/features/decisions/api/decisions";
import type { DigitalTwinNode } from "../api/digital_twin";

const HEALTH_BAR = (score: number) => {
  if (score >= 80) return { color: "bg-emerald-500", label: "Good" };
  if (score >= 60) return { color: "bg-yellow-500", label: "Fair" };
  if (score >= 40) return { color: "bg-orange-500", label: "At Risk" };
  return { color: "bg-red-500", label: "Critical" };
};

const STATUS_DOT: Record<string, string> = {
  operational: "bg-emerald-500",
  maintenance: "bg-amber-500",
  offline: "bg-gray-400",
  critical: "bg-red-500",
};

interface Props {
  node: DigitalTwinNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetDetailDrawer({ node, open, onOpenChange }: Props) {
  const { data: asset } = useQuery({
    queryKey: ["asset", node?.id],
    queryFn: () => assetsApi.get(node!.id),
    enabled: !!node && open,
  });

  const { data: decisions } = useQuery({
    queryKey: ["decisions", node?.id],
    queryFn: () => decisionsApi.getAssetRecommendations(node!.id),
    enabled: !!node && open,
  });

  if (!node) return null;

  const health = HEALTH_BAR(node.health_score);
  const recs = decisions?.recommendations?.[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-hidden flex flex-col">
        <SheetHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <span className={cn("h-3 w-3 rounded-full", STATUS_DOT[node.status] || "bg-muted")} />
            <SheetTitle className="text-base">{node.label}</SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* Health bar */}
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Overall Health</span>
              <span className={cn("font-medium", health.label === "Critical" && "text-red-500")}>
                {node.health_score.toFixed(0)}% — {health.label}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", health.color)}
                style={{ width: `${node.health_score}%` }}
              />
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatCard icon={Activity} label="Risk Score" value={node.risk_score.toFixed(0)} color={node.risk_score >= 45 ? "text-red-500" : ""} />
            <StatCard icon={Shield} label="Risk Level" value={node.risk_level} color={node.risk_level === "critical" ? "text-red-500" : ""} />
            <StatCard icon={AlertTriangle} label="Active Incidents" value={String(node.active_incidents)} color={node.active_incidents > 0 ? "text-red-500" : ""} />
            <StatCard icon={Wrench} label="Maintenance" value={node.maintenance_due ? "Due" : "OK"} color={node.maintenance_due ? "text-amber-500" : "text-emerald-500"} />
          </div>

          {/* Asset info */}
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asset Information</h4>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
              <Row label="Type" value={node.type} />
              <Row label="Status" value={node.status} />
              <Row label="Location" value={node.location || "N/A"} />
              <Row label="Children" value={String(node.children_count)} />
              <Row label="Asset ID" value={node.id.slice(0, 8) + "..."} />
            </div>
          </div>

          {/* Incident severities */}
          {node.incident_severities.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Incidents</h4>
              <div className="flex flex-wrap gap-1.5">
                {node.incident_severities.map((sev, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      sev === "critical" && "border-red-500/50 text-red-500",
                      sev === "high" && "border-orange-500/50 text-orange-500",
                      sev === "medium" && "border-yellow-500/50 text-yellow-500",
                    )}
                  >
                    {sev}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* AI recommendations */}
          {recs && (
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> AI Recommendation
              </h4>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">{recs.explanation || recs.summary}</p>
                {recs.recommended_actions.length > 0 && (
                  <ul className="space-y-1">
                    {recs.recommended_actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {action}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Loading state */}
          {!asset && !decisions && (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className={cn("text-xs font-medium truncate", color)}>{value}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize truncate ml-2">{value}</span>
    </div>
  );
}
