import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { SocialGraphLink, SocialGraphNode } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type SocialGraphSectionProps = {
  nodes: SocialGraphNode[];
  links: SocialGraphLink[];
};

type GraphNode = SocialGraphNode & {
  val: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
};

type GraphLink = SocialGraphLink & {
  id: string;
  distance: number;
  strength: number;
};

type ForceGraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

type ForceGraphRuntime = {
  d3Force: (forceName: string) => unknown;
  d3ReheatSimulation: () => unknown;
  zoomToFit: (durationMs?: number, padding?: number) => unknown;
};

type ForceLinkRuntime = {
  distance?: (distance: number | ((link: GraphLink) => number)) => ForceLinkRuntime;
  strength?: (strength: number | ((link: GraphLink) => number)) => ForceLinkRuntime;
  iterations?: (iterations: number) => ForceLinkRuntime;
};

type ForceChargeRuntime = {
  strength?: (strength: number | ((node: GraphNode) => number)) => ForceChargeRuntime;
  distanceMin?: (distance: number) => ForceChargeRuntime;
  distanceMax?: (distance: number) => ForceChargeRuntime;
};

type ForceCenterRuntime = {
  x?: (x: number) => ForceCenterRuntime;
  y?: (y: number) => ForceCenterRuntime;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toNodeId(input: unknown) {
  if (typeof input === "string") {
    return input;
  }
  if (input && typeof input === "object" && "id" in input) {
    const id = (input as { id?: unknown }).id;
    return typeof id === "string" ? id : "";
  }
  return "";
}

function resolveFriendTone(node: GraphNode) {
  if (node.type !== "friend") {
    return "neutral";
  }
  if (node.gender === "female") {
    return "female";
  }
  if (node.gender === "male") {
    return "male";
  }
  if (node.honorific === "ms") {
    return "female";
  }
  if (node.honorific === "mr") {
    return "male";
  }
  if (node.label.endsWith("女士")) {
    return "female";
  }
  if (node.label.endsWith("先生")) {
    return "male";
  }
  return "neutral";
}

function unwrapDefault<T>(moduleValue: unknown): T {
  const first = (moduleValue as { default?: unknown })?.default ?? moduleValue;
  const second = (first as { default?: unknown })?.default ?? first;
  return second as T;
}

export function SocialGraphSection({ nodes, links }: SocialGraphSectionProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ForceGraphRuntime | null>(null);
  const [graphSize, setGraphSize] = useState({ width: 960, height: 440 });
  const [activeLoad, setActiveLoad] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ForceGraph2D, setForceGraph2D] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActiveLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "260px 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const updateSize = () => {
      const available = Math.max(320, Math.floor(host.clientWidth - 16));
      const width = clamp(available, 320, 1480);
      const height = clamp(Math.round(width * 0.5), 380, 620);
      setGraphSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(host);
    window.addEventListener("resize", updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    if (!activeLoad) {
      return;
    }

    const canUseCanvas =
      typeof window !== "undefined" &&
      typeof document !== "undefined" &&
      !!document.createElement("canvas").getContext;
    if (!canUseCanvas) {
      setLoadError("当前环境不支持图谱画布渲染。");
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const forceGraphModule = await import("react-force-graph-2d");
        const Graph = unwrapDefault<ComponentType<Record<string, unknown>>>(forceGraphModule);
        if (!cancelled) {
          setForceGraph2D(() => Graph);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setForceGraph2D(null);
          setLoadError("图谱组件加载失败，已保留静态概览。");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeLoad]);

  const stageNodes = useMemo(
    () => nodes.filter((node) => node.type === "stage").sort((a, b) => a.order - b.order),
    [nodes],
  );
  const friendNodes = useMemo(
    () => nodes.filter((node) => node.type === "friend").sort((a, b) => a.order - b.order),
    [nodes],
  );
  const hasCompleteGraphData = stageNodes.length > 0 && friendNodes.length > 0 && links.length > 0;

  const graphData = useMemo<ForceGraphData>(() => {
    if (!hasCompleteGraphData) {
      return {
        nodes: [],
        links: [],
      };
    }

    const width = graphSize.width;
    const height = graphSize.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const stageRadiusX = clamp(width * 0.25, 130, 340);
    const stageRadiusY = clamp(height * 0.22, 96, 180);
    const edgePadding = 52;

    const stageAngles = new Map<string, number>();
    const stageByKey = new Map<string, { x: number; y: number }>();
    const stages: GraphNode[] = stageNodes.map((stage, index) => {
      const angle = (index / stageNodes.length) * Math.PI * 2 - Math.PI / 2;
      stageAngles.set(stage.stage_key, angle);
      const x = clamp(centerX + Math.cos(angle) * stageRadiusX, edgePadding, width - edgePadding);
      const y = clamp(centerY + Math.sin(angle) * stageRadiusY, edgePadding, height - edgePadding);
      stageByKey.set(stage.stage_key, { x, y });
      return {
        ...stage,
        val: 18,
        x,
        y,
      };
    });

    const friendBucket = new Map<string, SocialGraphNode[]>();

    friendNodes.forEach((friend) => {
      const bucket = friendBucket.get(friend.stage_key) ?? [];
      bucket.push(friend);
      friendBucket.set(friend.stage_key, bucket);
    });

    const friends: GraphNode[] = [];
    friendBucket.forEach((bucket, stageKey) => {
      const baseAngle = stageAngles.get(stageKey) ?? -Math.PI / 2;
      const anchor = stageByKey.get(stageKey);

      bucket.forEach((friend, idx) => {
        const ratio = bucket.length <= 1 ? 0 : idx / (bucket.length - 1) - 0.5;
        const spread = bucket.length <= 1 ? 0 : Math.min(0.9, (bucket.length - 1) * 0.2);
        const angle = baseAngle + ratio * spread + (idx % 2 === 0 ? 0.12 : -0.12);
        const radius = 74 + (idx % 3) * 18;
        const baseX = anchor?.x ?? centerX;
        const baseY = anchor?.y ?? centerY;
        const x = clamp(baseX + Math.cos(angle) * radius, edgePadding, width - edgePadding);
        const y = clamp(baseY + Math.sin(angle) * radius, edgePadding, height - edgePadding);

        friends.push({
          ...friend,
          val: 6,
          x,
          y,
        });
      });
    });

    const graphNodes = [...stages, ...friends];
    const positionedById = new Map<string, GraphNode>();
    graphNodes.forEach((node) => positionedById.set(node.id, node));

    const graphLinks = links
      .map((link, index) => {
        const sourceId = toNodeId((link as unknown as { source: unknown }).source);
        const targetId = toNodeId((link as unknown as { target: unknown }).target);
        const source = positionedById.get(sourceId);
        const target = positionedById.get(targetId);
        if (!source || !target) {
          return null;
        }
        const connectsStage = source.type === "stage" || target.type === "stage";
        const sameStage = source.stage_key === target.stage_key;
        return {
          id: `${source.id}-${target.id}-${index}`,
          source: source.id,
          target: target.id,
          distance: connectsStage ? (sameStage ? 100 : 128) : 84,
          strength: connectsStage ? 0.24 : 0.14,
        };
      })
      .filter((item): item is GraphLink => item !== null);

    return { nodes: graphNodes, links: graphLinks };
  }, [hasCompleteGraphData, stageNodes, friendNodes, links, graphSize.width, graphSize.height]);

  const nodeTypeById = useMemo(() => {
    const map = new Map<string, SocialGraphNode["type"]>();
    graphData.nodes.forEach((node) => {
      map.set(node.id, node.type);
    });
    return map;
  }, [graphData.nodes]);

  const nodeById = useMemo(() => {
    const map = new Map<string, GraphNode>();
    graphData.nodes.forEach((node) => {
      map.set(node.id, node);
    });
    return map;
  }, [graphData.nodes]);

  const connectedByNodeId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    graphData.links.forEach((link) => {
      const sourceId = toNodeId(link.source);
      const targetId = toNodeId(link.target);
      if (!sourceId || !targetId) {
        return;
      }
      const sourceSet = map.get(sourceId) ?? new Set<string>();
      sourceSet.add(targetId);
      map.set(sourceId, sourceSet);

      const targetSet = map.get(targetId) ?? new Set<string>();
      targetSet.add(sourceId);
      map.set(targetId, targetSet);
    });
    return map;
  }, [graphData.links]);

  const highlightedNodeIds = useMemo(() => {
    if (!hoveredNodeId) {
      return null;
    }
    const highlighted = new Set<string>([hoveredNodeId]);
    connectedByNodeId.get(hoveredNodeId)?.forEach((nodeId) => highlighted.add(nodeId));
    return highlighted;
  }, [hoveredNodeId, connectedByNodeId]);

  useEffect(() => {
    setHoveredNodeId(null);
  }, [graphData.nodes.length, graphData.links.length]);

  useEffect(() => {
    if (!ForceGraph2D || !hasCompleteGraphData || graphData.nodes.length === 0) {
      return;
    }

    const graph = graphRef.current;
    if (!graph) {
      return;
    }

    const linkForce = graph.d3Force("link") as ForceLinkRuntime | undefined;
    linkForce?.distance?.((link) => link.distance);
    linkForce?.strength?.((link) => link.strength);
    linkForce?.iterations?.(3);

    const chargeForce = graph.d3Force("charge") as ForceChargeRuntime | undefined;
    chargeForce?.strength?.((node) => (node.type === "stage" ? -320 : -140));
    chargeForce?.distanceMin?.(20);
    chargeForce?.distanceMax?.(420);

    const centerForce = graph.d3Force("center") as ForceCenterRuntime | undefined;
    centerForce?.x?.(graphSize.width / 2);
    centerForce?.y?.(graphSize.height / 2);

    graph.d3ReheatSimulation();
    const fitTimer = window.setTimeout(() => {
      graph.zoomToFit(620, 88);
    }, 260);

    return () => {
      window.clearTimeout(fitTimer);
    };
  }, [ForceGraph2D, graphData, graphSize.width, graphSize.height, hasCompleteGraphData]);

  return (
    <ScrollReveal className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">社交图谱</h2>
        <span className="text-sm text-slate-500">公开匿名节点：{friendNodes.length}</span>
      </div>

      <div ref={hostRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2 text-slate-100 shadow-sm">
        {hasCompleteGraphData ? (
          <div className="relative mx-auto overflow-hidden rounded-xl" style={{ width: graphSize.width, height: graphSize.height }}>
            {ForceGraph2D ? (
              <ForceGraph2D
                ref={graphRef}
                autoPauseRedraw={false}
                backgroundColor="#020617"
                cooldownTicks={2800}
                d3AlphaDecay={0.018}
                d3VelocityDecay={0.28}
                enableNodeDrag
                enablePanInteraction
                enableZoomInteraction
                graphData={graphData}
                height={graphSize.height}
                linkColor={(link: unknown) => {
                  const sourceId = toNodeId((link as GraphLink).source);
                  const targetId = toNodeId((link as GraphLink).target);
                  if (!hoveredNodeId) {
                    return "rgba(148,163,184,0.56)";
                  }
                  return sourceId === hoveredNodeId || targetId === hoveredNodeId
                    ? "rgba(148,163,184,0.92)"
                    : "rgba(71,85,105,0.24)";
                }}
                linkWidth={(link: unknown) => {
                  const sourceId = toNodeId((link as GraphLink).source);
                  const targetId = toNodeId((link as GraphLink).target);
                  const sourceType = nodeTypeById.get(sourceId);
                  const targetType = nodeTypeById.get(targetId);
                  const connectsStage = sourceType === "stage" || targetType === "stage";
                  if (hoveredNodeId && (sourceId === hoveredNodeId || targetId === hoveredNodeId)) {
                    return 2.4;
                  }
                  return connectsStage ? 1.6 : 1.2;
                }}
                maxZoom={3.2}
                minZoom={0.45}
                nodeCanvasObject={(node: unknown, canvasContext: CanvasRenderingContext2D, globalScale: number) => {
                  const typedNode = node as GraphNode;
                  const x = typedNode.x ?? 0;
                  const y = typedNode.y ?? 0;
                  const isStage = typedNode.type === "stage";
                  const isHovered = hoveredNodeId === typedNode.id;
                  const isRelated = highlightedNodeIds?.has(typedNode.id) ?? false;
                  const dimmed = Boolean(highlightedNodeIds) && !isRelated;
                  const tone = resolveFriendTone(typedNode);
                  const viewScale = Math.max(globalScale, 0.8);
                  const radius = (isStage ? 8.6 : 4.4) / viewScale;

                  canvasContext.beginPath();
                  canvasContext.arc(x, y, radius + (isHovered ? 1.2 / viewScale : 0), 0, Math.PI * 2);
                  let nodeFill = "rgba(148,163,184,0.95)";
                  if (tone === "female") {
                    nodeFill = "rgba(244,114,182,0.98)";
                  } else if (tone === "male") {
                    nodeFill = "rgba(96,165,250,0.98)";
                  }
                  canvasContext.fillStyle = dimmed
                    ? "rgba(148,163,184,0.32)"
                    : isStage
                      ? "rgba(248,250,252,0.98)"
                      : nodeFill;
                  canvasContext.fill();

                  if (isStage) {
                    canvasContext.lineWidth = (isHovered ? 2.4 : 1.6) / viewScale;
                    canvasContext.strokeStyle = dimmed ? "rgba(125,211,252,0.2)" : "rgba(125,211,252,0.9)";
                    canvasContext.stroke();
                  }

                  const fontSize = (isStage ? 14 : 11) / viewScale;
                  canvasContext.font = `${isStage ? 700 : 500} ${fontSize}px "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif`;
                  const label = typedNode.label;
                  const textWidth = canvasContext.measureText(label).width;
                  const labelX = x + radius + 6 / viewScale;
                  const labelY = y + fontSize * 0.33;

                  canvasContext.fillStyle = dimmed ? "rgba(2,6,23,0.24)" : "rgba(2,6,23,0.48)";
                  canvasContext.fillRect(
                    labelX - 4 / viewScale,
                    labelY - fontSize + 2 / viewScale,
                    textWidth + 8 / viewScale,
                    fontSize + 5 / viewScale,
                  );

                  let labelFill = "rgba(203,213,225,0.9)";
                  if (tone === "female") {
                    labelFill = "rgba(251,207,232,0.96)";
                  } else if (tone === "male") {
                    labelFill = "rgba(191,219,254,0.96)";
                  }
                  canvasContext.fillStyle = dimmed
                    ? isStage
                      ? "rgba(248,250,252,0.36)"
                      : "rgba(203,213,225,0.34)"
                    : isStage
                      ? "rgba(248,250,252,0.97)"
                      : labelFill;
                  canvasContext.fillText(label, labelX, labelY);
                }}
                nodeCanvasObjectMode={() => "replace"}
                nodeLabel={(node: unknown) => (node as GraphNode).label}
                nodeVal={(node: unknown) => (node as GraphNode).val}
                onNodeDrag={(node: unknown, translate: { x: number; y: number }) => {
                  const typedNode = node as GraphNode;
                  typedNode.fx = typedNode.x;
                  typedNode.fy = typedNode.y;

                  // Give linked nodes a visible "pull" effect while dragging.
                  const neighborIds = connectedByNodeId.get(typedNode.id);
                  if (neighborIds) {
                    neighborIds.forEach((neighborId) => {
                      const neighbor = nodeById.get(neighborId);
                      if (!neighbor) {
                        return;
                      }

                      const moveRatio = neighbor.type === "stage" ? 0.22 : 0.42;
                      neighbor.x = (neighbor.x ?? 0) + translate.x * moveRatio;
                      neighbor.y = (neighbor.y ?? 0) + translate.y * moveRatio;
                    });
                  }

                  graphRef.current?.d3ReheatSimulation();
                }}
                onNodeDragEnd={(node: unknown) => {
                  const typedNode = node as GraphNode;
                  typedNode.fx = undefined;
                  typedNode.fy = undefined;
                  graphRef.current?.d3ReheatSimulation();
                }}
                onNodeHover={(node: unknown) => setHoveredNodeId((node as GraphNode | null)?.id ?? null)}
                showPointerCursor={(obj: unknown) =>
                  Boolean(obj && typeof obj === "object" && "type" in (obj as { type?: unknown }))
                }
                width={graphSize.width}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-300">
                {loadError ?? "图谱组件加载中..."}
              </div>
            )}

            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-slate-900/45 px-2 py-1 text-xs text-slate-300">
              拖拽任意节点可重新编排关系
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            <p className="text-xs text-slate-300">匿名连线数据暂不可用，已展示分阶段概览。</p>

            {stageNodes.length === 0 ? (
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 px-4 py-5 text-sm text-slate-300">
                暂无社交图谱数据。
              </div>
            ) : (
              <StaggerContainer className="grid gap-3 md:grid-cols-3" stagger={0.06}>
                {stageNodes.map((stage) => {
                  const count = friendNodes.filter((node) => node.stage_key === stage.stage_key).length;
                  return (
                    <StaggerItem key={stage.id}>
                      <CardSpotlight className="rounded-xl bg-slate-900 p-4">
                        <h3 className="font-semibold">{stage.label}</h3>
                        <p className="mt-1 text-sm text-slate-300">匿名好友 {count} 位</p>
                      </CardSpotlight>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            )}
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}
