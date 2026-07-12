"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Layers, MapPin, Building2, AlertTriangle, Cpu } from "lucide-react";
import { useDigitalTwinTopology, useDigitalTwinFacilities, useDigitalTwinFacility } from "@/features/digital-twin/hooks/useDigitalTwin";
import { DigitalTwinCanvas } from "@/features/digital-twin/components/DigitalTwinCanvas";
import { AssetDetailDrawer } from "@/features/digital-twin/components/AssetDetailDrawer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DigitalTwinNode } from "@/features/digital-twin/api/digital_twin";

const HEALTH_BAR = (score: number) =>
  score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-yellow-500" : score >= 40 ? "bg-orange-500" : "bg-red-500";

export default function DigitalTwinPage() {
  const [search, setSearch] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<DigitalTwinNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showRiskOverlay, setShowRiskOverlay] = useState(true);
  const [showIncidentOverlay, setShowIncidentOverlay] = useState(true);

  const { data: facilities } = useDigitalTwinFacilities();
  const { data: fullTopology, isLoading } = useDigitalTwinTopology();
  const { data: facilityTopology } = useDigitalTwinFacility(selectedFacility);

  const topology = selectedFacility ? facilityTopology : fullTopology;
  const loading = isLoading || (!!selectedFacility && !facilityTopology);

  // Filter nodes by search
  const filteredNodes = useMemo(() => {
    if (!topology) return [];
    if (!search) return topology.nodes;
    const q = search.toLowerCase();
    return topology.nodes.filter(
      (n) => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q) || n.location?.toLowerCase().includes(q),
    );
  }, [topology, search]);

  // Derive edges that connect visible nodes
  const filteredEdges = useMemo(() => {
    if (!topology || filteredNodes.length === topology.nodes.length) return topology?.edges ?? [];
    const ids = new Set(filteredNodes.map((n) => n.id));
    return topology.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }, [topology, filteredNodes]);

  const handleNodeClick = useCallback((node: DigitalTwinNode) => {
    setSelectedNode(node);
    setDrawerOpen(true);
  }, []);

  const totalCritical = useMemo(
    () => topology?.nodes.filter((n) => n.status === "critical").length ?? 0,
    [topology],
  );

  const totalIncidents = useMemo(
    () => topology?.nodes.reduce((s, n) => s + n.active_incidents, 0) ?? 0,
    [topology],
  );

  const avgHealth = useMemo(
    () =>
      topology?.nodes.length
        ? topology.nodes.reduce((s, n) => s + n.health_score, 0) / topology.nodes.length
        : 0,
    [topology],
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left sidebar */}
      <div className="w-64 shrink-0 border-r bg-muted/10 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              className="pl-8 h-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-px bg-border">
          {[
            { label: "Nodes", value: topology?.nodes.length ?? 0, icon: Cpu },
            { label: "Critical", value: totalCritical, icon: AlertTriangle, color: "text-red-500" },
            { label: "Incidents", value: totalIncidents, icon: AlertTriangle, color: totalIncidents > 0 ? "text-red-500" : "" },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-background p-2 text-center">
                <Icon className={cn("h-3.5 w-3.5 mx-auto mb-0.5", k.color || "text-muted-foreground")} />
                <div className={cn("text-sm font-bold", k.color || "")}>{k.value}</div>
                <div className="text-[9px] text-muted-foreground">{k.label}</div>
              </div>
            );
          })}
        </div>

        {/* Facilities filter */}
        <div className="px-2 pt-2">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            <Building2 className="h-3 w-3" /> Facilities
          </div>
          <button
            onClick={() => setSelectedFacility(null)}
            className={cn(
              "flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs text-left transition-colors",
              !selectedFacility ? "bg-muted font-medium" : "hover:bg-muted/50",
            )}
          >
            <MapPin className="h-3 w-3 text-muted-foreground" />
            All Facilities
          </button>
          <ScrollArea className="max-h-[calc(100vh-28rem)]">
            <div className="space-y-0.5 pt-0.5">
              {(facilities ?? []).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFacility(f.id)}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs text-left transition-colors",
                    selectedFacility === f.id ? "bg-muted font-medium" : "hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      f.critical_count > 0 ? "bg-red-500" : f.health_score >= 80 ? "bg-emerald-500" : "bg-amber-500",
                    )}
                  />
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-[9px] text-muted-foreground">{f.asset_count}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Overlay toggles */}
        <div className="mt-auto border-t p-2 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Overlays</div>
          <ToggleBtn
            icon={Layers}
            label="Risk Scores"
            active={showRiskOverlay}
            onClick={() => setShowRiskOverlay(!showRiskOverlay)}
          />
          <ToggleBtn
            icon={AlertTriangle}
            label="Incidents"
            active={showIncidentOverlay}
            onClick={() => setShowIncidentOverlay(!showIncidentOverlay)}
          />
        </div>

        {/* Legend */}
        <div className="border-t p-2 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Legend</div>
          <div className="space-y-0.5">
            {[
              { label: "Operational", color: "bg-emerald-500" },
              { label: "Maintenance", color: "bg-amber-500" },
              { label: "Critical", color: "bg-red-500" },
              { label: "Offline", color: "bg-gray-400" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-[10px]">
                <span className={cn("h-2 w-2 rounded-full", l.color)} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-4 py-1.5 bg-muted/5">
          <div className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {selectedFacility
                ? facilities?.find((f) => f.id === selectedFacility)?.name ?? "Facility"
                : "Enterprise Digital Twin"}
            </span>
            {avgHealth > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", HEALTH_BAR(avgHealth))} />
                Avg Health: {avgHealth.toFixed(0)}%
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Zoom & pan</span>
            <span className="mx-1">·</span>
            <span>Click a node for details</span>
          </div>
        </div>

        {/* React Flow canvas */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-[80%] w-[95%]" />
            </div>
          ) : topology ? (
            <DigitalTwinCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id ?? null}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No topology data available. Add assets to get started.
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      <AssetDetailDrawer node={selectedNode} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}

function ToggleBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors",
        active ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/50",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
      <span className={cn("ml-auto h-1.5 w-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground/30")} />
    </button>
  );
}
