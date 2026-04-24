import { motion } from "motion/react";

type Skill = {
  name: string;
  level: number;
  icon: string;
  description: string;
};

const skills: Skill[] = [
  { name: "TypeScript", level: 88, icon: "🔷", description: "主力开发语言，用于全栈开发" },
  { name: "React", level: 85, icon: "⚛️", description: "前端框架，SPA/SSR 应用" },
  { name: "Python", level: 80, icon: "🐍", description: "后端服务、数据分析与自动化" },
  { name: "Tailwind CSS", level: 82, icon: "🎨", description: "原子化 CSS，高效 UI 构建" },
  { name: "Three.js / R3F", level: 65, icon: "🧊", description: "3D 可视化与交互场景" },
  { name: "Django", level: 75, icon: "🌿", description: "REST API 与后台管理系统" },
  { name: "Docker", level: 70, icon: "🐳", description: "容器化部署与 CI/CD" },
  { name: "Git", level: 85, icon: "📦", description: "版本控制与团队协作" },
];

export function SkillsSection() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-theme-ink">技术栈</h2>
        <p className="mt-2 text-sm text-theme-soft">我的核心技能与工具</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {skills.map((skill, i) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="rounded-2xl bg-theme-surface p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{skill.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-theme-ink">{skill.name}</span>
                  <span className="text-xs font-medium text-theme-soft">{skill.level}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-theme-surface">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#4f6ae5] to-[#6b917b]"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-theme-soft">{skill.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
