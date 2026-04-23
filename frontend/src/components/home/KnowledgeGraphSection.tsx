import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import type { KnowledgeGraphEdge, KnowledgeGraphNode, KnowledgeGraphPayload } from "../../api/knowledgeGraph";
import { fetchKnowledgeGraph } from "../../api/knowledgeGraph";
import { useAsync } from "../../hooks/useAsync";
import { ScrollReveal } from "../motion/ScrollReveal";
import { SectionTitleCard } from "../revamp/shared/SectionTitleCard";

type ForceGraphRuntime = {
  d3Force: (forceName: string) => unknown;
  d3ReheatSimulation?: () => void;
};

type ForceLinkRuntime = { distance: (fn: (link: unknown) => number) => unknown };
type ForceChargeRuntime = { strength: (value: number) => unknown };
type ForceCenterRuntime = { strength: (value: number) => unknown };

const GITHUB_REPO_URL = "https://github.com/hqy2020/GardenOfOpeningClouds/blob/main";

const CATEGORY_COLOR: Record<KnowledgeGraphNode["category"], string> = {
  entity: "#c96442", // terracotta
  hub: "#d97757", // coral
  source: "#87867f", // stone-gray
  exploration: "#b0aea5", // warm-silver
  index: "#5e5d59", // olive-gray
  other: "#4d4c48", // charcoal-warm
};

function unwrapDefault<T>(moduleValue: unknown): T {
  const first = (moduleValue as { default?: unknown })?.default ?? moduleValue;
  const second = (first as { default?: unknown })?.default ?? first;
  return second as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// easeOutBack：0→slight overshoot→1，用于节点 pop-in
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const p = t - 1;
  return 1 + c3 * p * p * p + c1 * p * p;
}

const POP_DURATION_MS = 520;

export function KnowledgeGraphSection() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ForceGraphRuntime | null>(null);
  const appearAtRef = useRef<Map<string, number>>(new Map());
  const animatingUntilRef = useRef<number>(0);
  const [graphSize, setGraphSize] = useState({ width: 960, height: 520 });
  const [activeLoad, setActiveLoad] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ForceGraph2D, setForceGraph2D] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [shownCount, setShownCount] = useState(0);

  const { data, loading, error } = useAsync<KnowledgeGraphPayload>(fetchKnowledgeGraph, []);
  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      const ta = a.git_created_at ?? "";
      const tb = b.git_created_at ?? "";
      if (ta !== tb) return ta.localeCompare(tb);
      return a.id.localeCompare(b.id);
    });
  }, [nodes]);

  // Build batches: 每秒投放一个 batch。
  // 有多 commit 时：一个 commit 时间戳 = 一个 batch（真实生长史）。
  // 只有单 commit（如本仓库当前情况，一次性大迁移）：按 id 字母序等分成若干个"视觉 batch"，每 batch ~5 个节点。
  const batches = useMemo(() => {
    const distinctTimes = new Set(sortedNodes.map((n) => n.git_created_at ?? "").filter(Boolean));
    if (distinctTimes.size >= 5) {
      const byTime = new Map<string, typeof sortedNodes>();
      for (const n of sortedNodes) {
        const key = n.git_created_at ?? "unknown";
        const arr = byTime.get(key) ?? [];
        arr.push(n);
        byTime.set(key, arr);
      }
      return Array.from(byTime.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([time, items]) => ({ time, items }));
    }
    const BATCH_SIZE = 5;
    const out: Array<{ time: string; items: typeof sortedNodes }> = [];
    for (let i = 0; i < sortedNodes.length; i += BATCH_SIZE) {
      const slice = sortedNodes.slice(i, i + BATCH_SIZE);
      out.push({ time: slice[0]?.git_created_at ?? `batch-${i}`, items: slice });
    }
    return out;
  }, [sortedNodes]);

  const earliestDate = sortedNodes[0]?.git_created_at ?? null;
  const shownBatchIndex =
    batches.length === 0 ? 0 : Math.min(Math.ceil(shownCount / Math.max(1, batches[0].items.length)), batches.length);
  const currentBatchLabel =
    shownBatchIndex > 0 ? `batch ${shownBatchIndex} / ${batches.length}` : "starting...";

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
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
    if (!host) return;
    const updateSize = () => {
      const available = Math.max(320, Math.floor(host.clientWidth - 16));
      const width = clamp(available, 320, 1480);
      const height = clamp(Math.round(width * 0.55), 420, 680);
      setGraphSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(host);
    window.addEventListener("resize", updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    if (!activeLoad) return;
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
        const mod = await import("react-force-graph-2d");
        const Graph = unwrapDefault<ComponentType<Record<string, unknown>>>(mod);
        if (!cancelled) {
          setForceGraph2D(() => Graph);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) setLoadError("图谱组件加载失败。");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeLoad]);

  // Growth animation: 每秒推进一个 batch（对应一次 commit 的所有节点）
  useEffect(() => {
    if (!activeLoad || !ForceGraph2D || batches.length === 0) return;
    setShownCount(0);
    let batchIdx = 0;
    const id = window.setInterval(() => {
      if (batchIdx >= batches.length) {
        window.clearInterval(id);
        return;
      }
      batchIdx += 1;
      const cumulative = batches.slice(0, batchIdx).reduce((sum, b) => sum + b.items.length, 0);
      setShownCount(cumulative);
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeLoad, ForceGraph2D, batches]);

  const visibleIds = useMemo(() => {
    return new Set(sortedNodes.slice(0, shownCount).map((n) => n.id));
  }, [sortedNodes, shownCount]);

  const graphData = useMemo(() => {
    if (shownCount === 0) return { nodes: [], links: [] };
    const now = performance.now();
    const visibleNodes = sortedNodes.slice(0, shownCount).map((n) => {
      if (!appearAtRef.current.has(n.id)) {
        appearAtRef.current.set(n.id, now);
      }
      return {
        id: n.id,
        title: n.title,
        category: n.category,
        path: n.path,
        git_created_at: n.git_created_at,
      };
    });
    const links: Array<KnowledgeGraphEdge & { id: string }> = [];
    for (const e of edges) {
      if (visibleIds.has(e.source) && visibleIds.has(e.target)) {
        links.push({ ...e, id: `${e.source}->${e.target}` });
      }
    }
    // 每次 shownCount 增加都让冒泡动画持续 POP_DURATION_MS
    animatingUntilRef.current = now + POP_DURATION_MS + 60;
    return { nodes: visibleNodes, links };
  }, [sortedNodes, shownCount, edges, visibleIds]);

  useEffect(() => {
    if (!ForceGraph2D || graphData.nodes.length === 0) return;
    const g = graphRef.current;
    if (!g) return;
    const linkForce = g.d3Force("link") as ForceLinkRuntime | undefined;
    if (linkForce?.distance) linkForce.distance(() => 42);
    const chargeForce = g.d3Force("charge") as ForceChargeRuntime | undefined;
    if (chargeForce?.strength) chargeForce.strength(-80);
    const centerForce = g.d3Force("center") as ForceCenterRuntime | undefined;
    if (centerForce?.strength) centerForce.strength(0.04);
    g.d3ReheatSimulation?.();
  }, [ForceGraph2D, graphData]);

  // 在节点冒泡期间强制 reheat simulation 以保证 canvas 持续重绘（否则 pop 动画看不到）
  useEffect(() => {
    if (!ForceGraph2D) return;
    let rafId = 0;
    const tick = () => {
      if (performance.now() < animatingUntilRef.current) {
        graphRef.current?.d3ReheatSimulation?.();
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [ForceGraph2D]);

  const totalCount = sortedNodes.length;
  const edgeCount = edges.length;

  return (
    <ScrollReveal className="space-y-4">
      <SectionTitleCard
        category="Knowledge"
        title="知识图谱"
        accentColor="#c96442"
        tagline="把云端花园的笔记以 Obsidian 关系图重现——按时间顺序一颗一颗长出来。"
      />

      <div
        ref={hostRef}
        className="relative overflow-hidden rounded-claude-lg border border-claude-dark-surface bg-claude-near-black shadow-whisper-lg"
        style={{ minHeight: 420 }}
      >
        {/* 右上角进度游标 */}
        <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col items-end gap-1 font-sans text-[11px] font-medium text-claude-warm-silver/80">
          <span className="tracking-[0.2em] uppercase">Growth</span>
          <span className="font-serif text-sm text-claude-coral">{currentBatchLabel}</span>
          <span className="text-[10px] text-claude-warm-silver/60">
            {totalCount === 0 ? "" : `${shownCount} / ${totalCount} notes · ${edgeCount} links`}
          </span>
        </div>
        {/* 左下角起始日期 */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 font-sans text-[10px] text-claude-warm-silver/60">
          since {formatDate(earliestDate)}
        </div>

        {loading ? (
          <div className="flex h-[420px] items-center justify-center text-sm text-claude-warm-silver/70">
            加载知识图谱数据中…
          </div>
        ) : error || loadError ? (
          <div className="flex h-[420px] flex-col items-center justify-center gap-2 text-sm text-claude-warm-silver/80">
            <span>{error || loadError}</span>
            <span className="text-xs text-claude-warm-silver/50">
              {totalCount} 条笔记 · {edgeCount} 条关系
            </span>
          </div>
        ) : !ForceGraph2D ? (
          <div className="flex h-[420px] items-center justify-center">
            <div className="text-center text-sm text-claude-warm-silver/70">
              <div className="font-serif text-lg text-claude-coral">正在加载图谱引擎…</div>
              <div className="mt-2 text-xs text-claude-warm-silver/50">
                {totalCount} 条笔记 · {edgeCount} 条关系
              </div>
            </div>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef as unknown as React.Ref<unknown>}
            graphData={graphData}
            width={graphSize.width}
            height={graphSize.height}
            backgroundColor="#141413"
            cooldownTicks={180}
            warmupTicks={60}
            linkColor={() => "rgba(176, 174, 165, 0.28)"}
            linkWidth={(link: unknown) => {
              const l = link as { source?: unknown; target?: unknown };
              const srcId =
                typeof l.source === "object" ? ((l.source as { id?: string }).id ?? "") : String(l.source ?? "");
              const dstId =
                typeof l.target === "object" ? ((l.target as { id?: string }).id ?? "") : String(l.target ?? "");
              if (hoveredId && (srcId === hoveredId || dstId === hoveredId)) return 2;
              return 0.8;
            }}
            nodeCanvasObjectMode={() => "replace"}
            nodeCanvasObject={(node: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const n = node as KnowledgeGraphNode & { x?: number; y?: number };
              if (n.x == null || n.y == null) return;
              const isHovered = hoveredId === n.id;
              const baseRadius = isHovered ? 5.5 : 3.8;
              // Pop-in animation (easeOutBack 0 → ~1.1 → 1.0)
              const appearAt = appearAtRef.current.get(n.id) ?? 0;
              const age = performance.now() - appearAt;
              let popScale = 1;
              if (age < POP_DURATION_MS) {
                popScale = easeOutBack(age / POP_DURATION_MS);
                if (popScale < 0) popScale = 0;
              }
              const radius = baseRadius * popScale;
              // 泡泡外圈（出现瞬间更明显的光晕）
              if (age < POP_DURATION_MS) {
                const haloT = Math.min(1, age / POP_DURATION_MS);
                const haloAlpha = 0.4 * (1 - haloT);
                if (haloAlpha > 0.01) {
                  ctx.beginPath();
                  const haloR = baseRadius * (1.4 + haloT * 1.8);
                  ctx.arc(n.x, n.y, haloR, 0, 2 * Math.PI, false);
                  ctx.fillStyle = (CATEGORY_COLOR[n.category] ?? CATEGORY_COLOR.other) + Math.round(haloAlpha * 255).toString(16).padStart(2, "0");
                  ctx.fill();
                }
              }
              if (radius <= 0.1) return;
              ctx.beginPath();
              ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = CATEGORY_COLOR[n.category] ?? CATEGORY_COLOR.other;
              ctx.fill();
              if (isHovered) {
                ctx.lineWidth = 1.5 / globalScale;
                ctx.strokeStyle = "rgba(250, 249, 245, 0.9)";
                ctx.stroke();
              }
              // Label on hover
              if (isHovered) {
                const label = n.title;
                const fontSize = Math.max(11, 12 / globalScale);
                ctx.font = `500 ${fontSize}px "Source Serif 4", Georgia, serif`;
                const metrics = ctx.measureText(label);
                const padX = 6;
                const padY = 3;
                ctx.fillStyle = "rgba(20, 20, 19, 0.85)";
                ctx.fillRect(
                  n.x + 8,
                  n.y - fontSize / 2 - padY,
                  metrics.width + padX * 2,
                  fontSize + padY * 2,
                );
                ctx.fillStyle = "#faf9f5";
                ctx.textBaseline = "middle";
                ctx.fillText(label, n.x + 8 + padX, n.y);
              }
            }}
            onNodeHover={(node: unknown) => {
              const n = node as { id?: string } | null;
              setHoveredId(n?.id ?? null);
            }}
            onNodeClick={(node: unknown) => {
              const n = node as KnowledgeGraphNode | null;
              if (!n?.path) return;
              window.open(`${GITHUB_REPO_URL}/${n.path}`, "_blank", "noopener,noreferrer");
            }}
          />
        )}
      </div>
    </ScrollReveal>
  );
}
