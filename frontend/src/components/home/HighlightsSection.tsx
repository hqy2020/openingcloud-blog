import { motion } from "motion/react";
import type { HighlightStage } from "../../api/home";

type HighlightsSectionProps = {
  stages: HighlightStage[];
};

export function HighlightsSection({ stages }: HighlightsSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">高光时刻</h2>
        <span className="text-sm text-slate-500">{stages.length} 个阶段</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage, idx) => (
          <motion.article
            key={`${stage.title}-${idx}`}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-slate-900">{stage.title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {stage.start_date || ""}
              {stage.end_date ? ` - ${stage.end_date}` : ""}
            </p>
            <p className="mt-3 text-sm text-slate-700">{stage.description || "持续成长中"}</p>

            <ul className="mt-4 space-y-2">
              {stage.items.slice(0, 4).map((item) => (
                <li key={`${stage.title}-${item.title}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {item.title}
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
