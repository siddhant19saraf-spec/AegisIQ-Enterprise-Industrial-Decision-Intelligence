"use client";

import { useEffect, useRef, useState } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import type { GraphNode, GraphEdge } from "../api/graph";

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
  relationship: string;
  label: string;
  weight: number;
}

const NODE_COLORS: Record<string, string> = {
  asset: "#3b82f6",
  incident: "#ef4444",
  location: "#22c55e",
  worker: "#a855f7",
};

const STATUS_COLORS: Record<string, string> = {
  critical: "#ef4444",
  operational: "#22c55e",
  maintenance: "#eab308",
  offline: "#6b7280",
  open: "#ef4444",
  investigating: "#f97316",
  resolved: "#22c55e",
  closed: "#6b7280",
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  PARENT_OF: "#3b82f6",
  HAS_INCIDENT: "#ef4444",
  LOCATED_IN: "#22c55e",
  DEPENDS_ON: "#a855f7",
};

const RADIUS: Record<string, number> = {
  asset: 28,
  incident: 22,
  location: 20,
};

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
  width?: number;
  height?: number;
}

export function GraphCanvas({
  nodes: inputNodes,
  edges: inputEdges,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
  width: containerWidth,
  height: containerHeight,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dim, setDim] = useState({ width: 800, height: 500 });
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);

  useEffect(() => {
    if (containerWidth && containerHeight) {
      setDim({ width: containerWidth, height: containerHeight });
      return;
    }
    const update = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDim({ width: rect.width, height: rect.height });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [containerWidth, containerHeight]);

  useEffect(() => {
    const nodeData: SimNode[] = inputNodes.map((n) => ({ ...n, x: dim.width / 2, y: dim.height / 2, vx: 0, vy: 0 }));
    const linkData: SimLink[] = inputEdges.map((e) => ({ ...e, source: e.source, target: e.target }));

    const rawSim = forceSimulation(nodeData)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .force("link", (forceLink(linkData) as any).id((d: any) => d.id).distance(100))
      .force("charge", forceManyBody().strength(-250))
      .force("center", forceCenter(dim.width / 2, dim.height / 2))
      .force("collide", forceCollide(35))
      .alphaDecay(0.02);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sim = rawSim as any;

    const tick = () => {
      setSimNodes([...sim.nodes()]);
      setSimLinks([...sim.links()]);
    };
    sim.on("tick", tick);
    sim.on("end", tick);

    return () => { sim.stop(); };
  }, [inputNodes, inputEdges, dim]);

  const getNodeColor = (node: GraphNode) => {
    if (node.status && STATUS_COLORS[node.status]) return STATUS_COLORS[node.status];
    return NODE_COLORS[node.type] || "#6b7280";
  };

  const getEdgeColor = (edge: GraphEdge) => {
    return RELATIONSHIP_COLORS[edge.relationship] || "#6b7280";
  };

  return (
    <svg ref={svgRef} width={dim.width} height={dim.height} className="overflow-visible">
      <defs>
        {inputNodes.map((node) => (
          <radialGradient key={node.id} id={`grad-${node.id}`}>
            <stop offset="0%" stopColor={getNodeColor(node)} stopOpacity={0.8} />
            <stop offset="100%" stopColor={getNodeColor(node)} stopOpacity={0.4} />
          </radialGradient>
        ))}
      </defs>
      {simLinks.map((link, i) => {
        const s = typeof link.source === "object" ? link.source : null;
        const t = typeof link.target === "object" ? link.target : null;
        if (!s || !t) return null;
        const isSelected = selectedNodeId && (s.id === selectedNodeId || t.id === selectedNodeId);
        return (
          <g key={`edge-${i}`}>
            <line
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={getEdgeColor(link as unknown as GraphEdge)}
              strokeWidth={(link.weight || 0.5) * 3}
              strokeOpacity={isSelected ? 0.8 : 0.2}
              className="transition-opacity"
            />
            {(s.x && t.x) && (
              <text
                x={(s.x + t.x) / 2}
                y={(s.y + t.y) / 2 - 6}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                className="text-muted-foreground/60 pointer-events-none"
              >
                {link.label}
              </text>
            )}
          </g>
        );
      })}
      {simNodes.map((node) => {
        const radius = RADIUS[node.type] || 20;
        const isSelected = selectedNodeId === node.id;
        return (
          <g
            key={node.id}
            transform={`translate(${node.x},${node.y})`}
            onClick={() => onNodeClick?.(node)}
            onMouseEnter={() => onNodeHover?.(node)}
            onMouseLeave={() => onNodeHover?.(null)}
            className="cursor-pointer"
          >
            <circle
              r={radius}
              fill={`url(#grad-${node.id})`}
              stroke={isSelected ? "#fff" : getNodeColor(node)}
              strokeWidth={isSelected ? 3 : 1.5}
              className="transition-all"
            />
            {node.type === "incident" && (
              <text textAnchor="middle" dy={4} fontSize={12} fill="white" fontWeight="bold">!</text>
            )}
            <text
              y={radius + 14}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              className="pointer-events-none"
            >
              {node.label.length > 16 ? node.label.slice(0, 16) + "..." : node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
