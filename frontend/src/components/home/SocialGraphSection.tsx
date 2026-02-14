import { useEffect, useMemo, useState } from "react";
import type { SocialGraphLink, SocialGraphNode } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type SocialGraphSectionProps = {
  nodes: SocialGraphNode[];
  links: SocialGraphLink[];
};

type PositionedNode = {
  id: string;
  label: string;
  type: SocialGraphNode["type"];
  stage_key: string;
  x: number;
  y: number;
};

type PositionedLink = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
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

export function SocialGraphSection({ nodes, links }: SocialGraphSectionProps) {
  const [graphSize, setGraphSize] = useState({ width: 960, height: 440 });

  useEffect(() => {
    const updateSize = () => {
      const width = Math.max(320, Math.min(window.innerWidth - 80, 1480));
      const height = Math.max(380, Math.min(Math.round(width * 0.48), 620));
      setGraphSize({ width, height });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const stageNodes = useMemo(
    () => nodes.filter((node) => node.type === "stage").sort((a, b) => a.order - b.order),
    [nodes],
  );
  const friendNodes = useMemo(
    () => nodes.filter((node) => node.type === "friend").sort((a, b) => a.order - b.order),
    [nodes],
  );
  const hasCompleteGraphData = stageNodes.length > 0 && friendNodes.length > 0 && links.length > 0;

  const layout = useMemo(() => {
    if (!hasCompleteGraphData) {
      return {
        stages: [] as PositionedNode[],
        friends: [] as PositionedNode[],
        linkLines: [] as PositionedLink[],
      };
    }

    const width = graphSize.width;
    const height = graphSize.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const stageRadiusX = clamp(width * 0.42, 230, 560);
    const stageRadiusY = clamp(height * 0.38, 130, 250);
    const friendRadiusX = clamp(stageRadiusX * 0.72, 160, 420);
    const friendRadiusY = clamp(stageRadiusY * 0.72, 95, 180);
    const edgePadding = 52;

    const stageAngles = new Map<string, number>();
    const stages: PositionedNode[] = stageNodes.map((stage, index) => {
      const angle = (index / stageNodes.length) * Math.PI * 2 - Math.PI / 2;
      stageAngles.set(stage.stage_key, angle);
      const x = clamp(centerX + Math.cos(angle) * stageRadiusX, edgePadding, width - edgePadding);
      const y = clamp(centerY + Math.sin(angle) * stageRadiusY, edgePadding, height - edgePadding);
      return {
        id: stage.id,
        label: stage.label,
        type: stage.type,
        stage_key: stage.stage_key,
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

    const friends: PositionedNode[] = [];
    friendBucket.forEach((bucket, stageKey) => {
      const baseAngle = stageAngles.get(stageKey);
      if (typeof baseAngle !== "number") {
        return;
      }

      const spread = bucket.length <= 1 ? 0 : Math.min(0.72, (bucket.length - 1) * 0.18);

      bucket.forEach((friend, idx) => {
        const ratio = bucket.length <= 1 ? 0 : idx / (bucket.length - 1) - 0.5;
        const angle = baseAngle + ratio * spread;
        const x = clamp(centerX + Math.cos(angle) * friendRadiusX, edgePadding, width - edgePadding);
        const y = clamp(centerY + Math.sin(angle) * friendRadiusY, edgePadding, height - edgePadding);

        friends.push({
          id: friend.id,
          label: friend.label,
          type: friend.type,
          stage_key: friend.stage_key,
          x,
          y,
        });
      });
    });

    const positionedById = new Map<string, PositionedNode>();
    [...stages, ...friends].forEach((node) => positionedById.set(node.id, node));

    const linkLines: PositionedLink[] = links
      .map((link, index) => {
        const source = positionedById.get(toNodeId((link as unknown as { source: unknown }).source));
        const target = positionedById.get(toNodeId((link as unknown as { target: unknown }).target));
        if (!source || !target) {
          return null;
        }
        return {
          key: `${source.id}-${target.id}-${index}`,
          x1: source.x,
          y1: source.y,
          x2: target.x,
          y2: target.y,
        };
      })
      .filter((item): item is PositionedLink => item !== null);

    return { stages, friends, linkLines };
  }, [hasCompleteGraphData, stageNodes, friendNodes, links, graphSize.width, graphSize.height]);

  return (
    <ScrollReveal className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">社交图谱</h2>
        <span className="text-sm text-slate-500">公开匿名节点：{friendNodes.length}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2 text-slate-100 shadow-sm">
        {hasCompleteGraphData ? (
          <div className="relative mx-auto" style={{ width: graphSize.width, height: graphSize.height }}>
            <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${graphSize.width} ${graphSize.height}`}>
              {layout.linkLines.map((line) => (
                <line
                  key={line.key}
                  stroke="rgba(148, 163, 184, 0.55)"
                  strokeLinecap="round"
                  strokeWidth={1.8}
                  x1={line.x1}
                  x2={line.x2}
                  y1={line.y1}
                  y2={line.y2}
                />
              ))}
            </svg>

            {layout.stages.map((stage) => (
              <div
                key={stage.id}
                className="pointer-events-none absolute flex items-center gap-2"
                style={{ left: stage.x, top: stage.y, transform: "translate(-50%, -50%)" }}
              >
                <span className="inline-block h-4 w-4 rounded-full bg-slate-100 ring-2 ring-blue-300/70" />
                <span className="rounded bg-slate-950/35 px-1.5 py-0.5 text-sm font-semibold text-slate-100">
                  {stage.label}
                </span>
              </div>
            ))}

            {layout.friends.map((friend) => (
              <div
                key={friend.id}
                className="pointer-events-none absolute flex items-center gap-1.5"
                style={{ left: friend.x, top: friend.y, transform: "translate(-50%, -50%)" }}
              >
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="rounded bg-slate-950/30 px-1 py-0.5 text-xs font-medium text-slate-300">{friend.label}</span>
              </div>
            ))}
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
