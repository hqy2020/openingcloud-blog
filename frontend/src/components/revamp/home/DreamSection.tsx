import { AnimatedList } from "../../ui/AnimatedList";
import { SectionTitleCard } from "../shared/SectionTitleCard";

type WishItem = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
};

const WISHES: WishItem[] = [
  {
    id: "3d-printer",
    emoji: "🖨️",
    title: "3D 打印机",
    description: "Bambu Lab P1S — 随时把灵感变成实物，快速原型验证。",
    priority: "high",
  },
  {
    id: "drone",
    emoji: "🚁",
    title: "无人机",
    description: "DJI Mini 4 Pro — 用航拍视角记录旅行和城市风景。",
    priority: "high",
  },
  {
    id: "ambient-light",
    emoji: "💡",
    title: "窗前氛围灯",
    description: "Govee Glide Hexa Pro — 打造沉浸式编程与阅读环境。",
    priority: "medium",
  },
  {
    id: "action-camera",
    emoji: "📷",
    title: "运动摄像机",
    description: "GoPro Hero 13 — 记录骑行、徒步和极限运动的第一视角。",
    priority: "medium",
  },
  {
    id: "ai-glasses",
    emoji: "🕶️",
    title: "AI 眼镜",
    description: "Meta Ray-Ban — 随时语音交互，拍照记录生活碎片。",
    priority: "low",
  },
];

const priorityColors: Record<WishItem["priority"], string> = {
  high: "border-amber-300/60 bg-amber-50/60",
  medium: "border-sky-300/60 bg-sky-50/60",
  low: "border-slate-200/80 bg-white/70",
};

const priorityLabels: Record<WishItem["priority"], string> = {
  high: "Most Wanted",
  medium: "Want",
  low: "Nice to Have",
};

function WishCard({ wish }: { wish: WishItem }) {
  return (
    <article
      className={`flex items-start gap-3 rounded-2xl border p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] backdrop-blur ${priorityColors[wish.priority]}`}
    >
      <span className="mt-0.5 text-2xl">{wish.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">{wish.title}</h3>
          <span className="rounded-full border border-current/20 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {priorityLabels[wish.priority]}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-600">{wish.description}</p>
      </div>
    </article>
  );
}

export function DreamSection() {
  return (
    <section id="dream" className="space-y-4">
      <SectionTitleCard category="Dream" title="心愿清单" accentColor="#f97316" tagline="还没拥有的东西，先写下来，总有一天会实现。" />

      <div className="mx-auto min-w-[70%]">
        <AnimatedList delay={2400} className="space-y-3">
          {WISHES.map((wish) => (
            <WishCard key={wish.id} wish={wish} />
          ))}
        </AnimatedList>
      </div>
    </section>
  );
}
