import { motion } from "motion/react";
import type { TimelineNode } from "../../api/home";

type TimelineSectionProps = {
  nodes: TimelineNode[];
};

function formatPeriod(node: TimelineNode) {
  if (!node.end_date) {
    return node.start_date;
  }
  return `${node.start_date} - ${node.end_date}`;
}

export function TimelineSection({ nodes }: TimelineSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">人生足迹</h2>
        <span className="text-sm text-slate-500">{nodes.length} 个节点</span>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-max items-start gap-5">
          {nodes.map((node, idx) => (
            <motion.article
              key={`${node.title}-${node.start_date}-${idx}`}
              animate={{ opacity: 1, y: 0 }}
              className="w-72 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              initial={{ opacity: 0, y: 18 }}
              transition={{ delay: idx * 0.06, duration: 0.35 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-500">{node.type}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{node.impact}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{node.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{formatPeriod(node)}</p>
              <p className="mt-3 line-clamp-3 text-sm text-slate-700">{node.description || "暂无描述"}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
