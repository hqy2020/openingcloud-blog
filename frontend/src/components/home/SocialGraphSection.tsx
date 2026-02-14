import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import type { SocialGraphLink, SocialGraphNode } from "../../api/home";

type SocialGraphSectionProps = {
  nodes: SocialGraphNode[];
  links: SocialGraphLink[];
};

type ForceGraphProps = {
  graphData: {
    nodes: SocialGraphNode[];
    links: SocialGraphLink[];
  };
  width?: number;
  height?: number;
  nodeLabel?: (node: SocialGraphNode) => string;
  nodeAutoColorBy?: string;
  linkColor?: () => string;
  backgroundColor?: string;
  nodeCanvasObjectMode?: () => "replace";
  nodeCanvasObject?: (node: SocialGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => void;
};

export function SocialGraphSection({ nodes, links }: SocialGraphSectionProps) {
  const [Graph, setGraph] = useState<ComponentType<ForceGraphProps> | null>(null);
  const [graphSize, setGraphSize] = useState({ width: 960, height: 440 });

  useEffect(() => {
    const canUseCanvas =
      typeof window !== "undefined" &&
      typeof document !== "undefined" &&
      !!document.createElement("canvas").getContext;

    if (!canUseCanvas) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const mod = await import("react-force-graph-2d");
      if (!cancelled) {
        setGraph(() => mod.default as ComponentType<ForceGraphProps>);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const updateSize = () => {
      const width = Math.max(320, Math.min(window.innerWidth - 80, 1040));
      const height = Math.max(360, Math.min(Math.round(width * 0.5), 520));
      setGraphSize({ width, height });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">社交图谱</h2>
        <span className="text-sm text-slate-500">公开匿名节点：{nodes.filter((item) => item.type === "friend").length}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2 text-slate-100 shadow-sm">
        {Graph ? (
          <Graph
            backgroundColor="#020617"
            graphData={graphData}
            linkColor={() => "rgba(148, 163, 184, 0.5)"}
            nodeAutoColorBy="stage_key"
            nodeCanvasObject={(node, ctx, globalScale) => {
              const fontSize = Math.max(10, 13 / globalScale);
              ctx.font = `${fontSize}px sans-serif`;
              ctx.fillStyle = node.type === "stage" ? "#f8fafc" : "#cbd5e1";
              ctx.beginPath();
              ctx.arc(0, 0, node.type === "stage" ? 9 : 5, 0, 2 * Math.PI, false);
              ctx.fill();
              ctx.fillText(node.label, node.type === "stage" ? 12 : 8, 4);
            }}
            nodeCanvasObjectMode={() => "replace"}
            nodeLabel={(node) => node.label}
            width={graphSize.width}
            height={graphSize.height}
          />
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-3">
            {nodes
              .filter((node) => node.type === "stage")
              .map((stage) => {
                const count = nodes.filter((node) => node.type === "friend" && node.stage_key === stage.stage_key).length;
                return (
                  <article key={stage.id} className="rounded-xl bg-slate-900 p-4">
                    <h3 className="font-semibold">{stage.label}</h3>
                    <p className="mt-1 text-sm text-slate-300">匿名好友 {count} 位</p>
                  </article>
                );
              })}
          </div>
        )}
      </div>
    </section>
  );
}
