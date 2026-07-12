"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Network, AlertTriangle,
  MapPin, Cpu, ArrowRight,
} from "lucide-react";
import { graphApi } from "@/features/knowledge-graph/api/graph";
import { GraphCanvas } from "@/features/knowledge-graph/components/GraphCanvas";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { GraphNode, ImpactAnalysis } from "@/features/knowledge-graph/api/graph";

const TYPE_ICONS: Record<string, React.ElementType> = {
  asset: Cpu,
  incident: AlertTriangle,
  location: MapPin,
};

const TYPE_COLORS: Record<string, string> = {
  asset: "text-blue-500",
  incident: "text-red-500",
  location: "text-emerald-500",
};

export default function KnowledgeGraphPage() {
  const [search, setSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [impactData, setImpactData] = useState<ImpactAnalysis | null>(null);
  const { data: graphData, isLoading } = useQuery({
    queryKey: ["knowledge-graph"],
    queryFn: graphApi.getFull,
    refetchInterval: 30000,
  });

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node);
    if (node.type === "asset") {
      try {
        const impact = await graphApi.getImpact(node.id);
        setImpactData(impact);
      } catch {
        setImpactData(null);
      }
    } else {
      setImpactData(null);
    }
  }, []);

  const filteredNodes = graphData?.nodes.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q) || n.id.toLowerCase().includes(q);
  }) ?? [];

  const filteredEdges = graphData?.edges.filter((e) => {
    if (!search) return true;
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return nodeIds.has(e.source) && nodeIds.has(e.target);
  }) ?? [];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0">
      {/* Left sidebar */}
      <div className="w-72 shrink-0 border-r bg-muted/10 flex flex-col">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              className="pl-8 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        {graphData && (
          <div className="grid grid-cols-3 gap-px bg-border">
            <div className="bg-background p-2 text-center">
              <div className="text-lg font-bold">{graphData.stats.node_count}</div>
              <div className="text-[10px] text-muted-foreground">Nodes</div>
            </div>
            <div className="bg-background p-2 text-center">
              <div className="text-lg font-bold">{graphData.stats.edge_count}</div>
              <div className="text-[10px] text-muted-foreground">Edges</div>
            </div>
            <div className="bg-background p-2 text-center">
              <div className="text-lg font-bold">{graphData.stats.node_types.length}</div>
              <div className="text-[10px] text-muted-foreground">Types</div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="px-3 py-2 border-b">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Legend</p>
          <div className="space-y-1">
            {[
              { type: "asset", label: "Assets", color: "bg-blue-500" },
              { type: "incident", label: "Incidents", color: "bg-red-500" },
              { type: "location", label: "Locations", color: "bg-emerald-500" },
            ].map((l) => (
              <div key={l.type} className="flex items-center gap-2 text-xs">
                <div className={cn("h-2.5 w-2.5 rounded-full", l.color)} />
                <span className="text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Node list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {graphData?.nodes.map((node) => {
              const Icon = TYPE_ICONS[node.type] || Network;
              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                    selectedNode?.id === node.id && "bg-muted",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", TYPE_COLORS[node.type])} />
                  <span className="truncate flex-1">{node.label}</span>
                  {node.status && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1">{node.status}</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 relative bg-muted/5">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-96 w-3/4" />
          </div>
        ) : (
          <GraphCanvas
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodeClick={handleNodeClick}
            onNodeHover={setHoveredNode}
            selectedNodeId={selectedNode?.id}
          />
        )}

        {/* Hover tooltip */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 rounded-lg border bg-background px-3 py-2 shadow-lg text-xs max-w-xs">
            <div className="flex items-center gap-2 font-medium">
              <div className={cn("h-2 w-2 rounded-full", hoveredNode.status ? "bg-red-500" : "bg-blue-500")} />
              {hoveredNode.label}
            </div>
            <p className="text-muted-foreground mt-0.5">Type: {hoveredNode.type}</p>
            {hoveredNode.status && <p className="text-muted-foreground">Status: {hoveredNode.status}</p>}
            {hoveredNode.severity && <p className="text-muted-foreground">Severity: {hoveredNode.severity}</p>}
          </div>
        )}
      </div>

      {/* Right panel */}
      {selectedNode && (
        <div className="w-80 shrink-0 border-l bg-muted/10 flex flex-col">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <div className={cn("h-2.5 w-2.5 rounded-full", selectedNode.status ? "bg-red-500" : "bg-blue-500")} />
              <h3 className="font-semibold text-sm truncate">{selectedNode.label}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">{selectedNode.type}</Badge>
              {selectedNode.status && (
                <Badge variant="secondary" className="text-[10px]">{selectedNode.status}</Badge>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 p-3">
            {impactData ? (
              <div className="space-y-3">
                {/* Impact details */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Asset Details</h4>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-muted-foreground">Name:</span> {impactData.asset.name}</p>
                    <p><span className="text-muted-foreground">Type:</span> {impactData.asset.type}</p>
                    <p><span className="text-muted-foreground">Status:</span> {impactData.asset.status}</p>
                    {impactData.location && <p><span className="text-muted-foreground">Location:</span> {impactData.location}</p>}
                  </div>
                </div>

                {impactData.parent && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Parent Asset</h4>
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{impactData.parent.name}</span>
                    </div>
                  </div>
                )}

                {impactData.children.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Children ({impactData.children.length})</h4>
                    <div className="space-y-1">
                      {impactData.children.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-xs">
                          <Cpu className="h-3 w-3 text-blue-500" />
                          <span className="flex-1">{c.name}</span>
                          <Badge variant="outline" className="text-[9px] h-4">{c.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {impactData.incidents.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Incidents ({impactData.incidents.length})</h4>
                    <div className="space-y-1">
                      {impactData.incidents.map((inc) => (
                        <div key={inc.id} className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-xs">
                          <AlertTriangle className={cn(
                            "h-3 w-3",
                            inc.severity === "critical" ? "text-red-500" : inc.severity === "high" ? "text-amber-500" : "text-muted-foreground",
                          )} />
                          <span className="flex-1 truncate">{inc.title}</span>
                          <Badge variant="outline" className="text-[9px] h-4">{inc.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {impactData.affected_assets.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Affected Co-located Assets ({impactData.affected_assets.length})</h4>
                    <div className="space-y-1">
                      {impactData.affected_assets.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-1.5 text-xs">
                          <Cpu className="h-3 w-3 text-muted-foreground" />
                          <span className="flex-1">{a.name}</span>
                          <Badge variant="outline" className="text-[9px] h-4">{a.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Network className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Select an asset node to see impact analysis</p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
