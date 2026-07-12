"use client";

import { useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import type { DigitalTwinNode, DigitalTwinEdge } from "../api/digital_twin";

const HEALTH_COLOR = (score: number) =>
  score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";

const STATUS_DOT: Record<string, string> = {
  operational: "bg-emerald-500",
  maintenance: "bg-amber-500",
  offline: "bg-gray-400",
  critical: "bg-red-500",
};

function TwinNode({ data }: NodeProps) {
  const node = data as unknown as DigitalTwinNode;
  const healthColor = HEALTH_COLOR(node.health_score);
  return (
    <div
      className={cn(
        "group relative rounded-lg border-2 bg-card px-3 py-2 shadow-sm transition-all hover:shadow-md min-w-[140px]",
        node.risk_level === "critical" && "border-red-500/50",
        node.risk_level === "high" && "border-orange-500/40",
        node.risk_level === "medium" && "border-yellow-500/30",
        node.risk_level === "low" && "border-green-500/20",
        node.maintenance_due && "ring-2 ring-amber-400/60",
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", STATUS_DOT[node.status] || "bg-muted")} />
        <span className="text-xs font-medium leading-tight truncate">{node.label}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: healthColor }} />
          <span>{node.health_score.toFixed(0)}</span>
        </div>
        <span>/</span>
        <span className={cn(node.risk_score >= 45 ? "text-red-500 font-medium" : "")}>
          R:{node.risk_score.toFixed(0)}
        </span>
        {node.active_incidents > 0 && (
          <span className="ml-auto flex items-center gap-0.5 text-red-500 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            {node.active_incidents}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  );
}

const nodeTypes = { twinNode: TwinNode };

interface Props {
  nodes: DigitalTwinNode[];
  edges: DigitalTwinEdge[];
  onNodeClick?: (node: DigitalTwinNode) => void;
  selectedNodeId?: string | null;
}

export function DigitalTwinCanvas({ nodes: inputNodes, edges: inputEdges, onNodeClick, selectedNodeId: _selectedNodeId }: Props) {
  const rfNodes: Node[] = useMemo(
    () =>
      inputNodes.map((n) => ({
        id: n.id,
        type: "twinNode",
        position: { x: 0, y: 0 },
        data: n as unknown as Record<string, unknown>,
      })),
    [inputNodes],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      inputEdges.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        animated: e.relationship === "HAS_INCIDENT",
        style: {
          stroke: e.relationship === "PARENT_OF" ? "#3b82f6" : "#a855f7",
          strokeWidth: Math.max(1, e.weight * 2),
          opacity: 0.5,
        },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
        labelStyle: { fontSize: 9, fill: "currentColor" },
      })),
    [inputEdges],
  );

  const [nodesState, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  useEffect(() => { setNodes(rfNodes); }, [rfNodes, setNodes]);
  useEffect(() => { setEdges(rfEdges); }, [rfEdges, setEdges]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.data as unknown as DigitalTwinNode);
    },
    [onNodeClick],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable
        deleteKeyCode={null}
        className="bg-muted/5"
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} className="!shadow-sm" />
        <MiniMap
          nodeStrokeWidth={2}
          pannable
          zoomable
          className="!shadow-md !rounded-lg"
          nodeColor={(n) => {
            const d = n.data as unknown as DigitalTwinNode;
            return d ? HEALTH_COLOR(d.health_score) : "#666";
          }}
        />
      </ReactFlow>
    </div>
  );
}
