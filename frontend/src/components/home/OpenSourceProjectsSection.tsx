import type { GithubProject } from "../../api/home";
import { ScrollReveal } from "../motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "../motion/StaggerContainer";
import { CardSpotlight } from "../ui/CardSpotlight";

type OpenSourceProjectsSectionProps = {
  projects: GithubProject[];
};

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  PHP: "#4F5D95",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Astro: "#ff5a03",
};

function StarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path
        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-17.628a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm0 15.814a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

export function OpenSourceProjectsSection({ projects }: OpenSourceProjectsSectionProps) {
  if (projects.length === 0) {
    return (
      <ScrollReveal className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Vibe Coding 开源项目</h2>
          <span className="text-sm text-slate-500">0 个项目</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-6 text-sm text-slate-600">
          暂无开源项目数据
        </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal className="space-y-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Vibe Coding 开源项目</h2>
        <span className="text-sm text-slate-500">{projects.length} 个项目</span>
      </div>

      <StaggerContainer className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" stagger={0.07}>
        {projects.map((project) => (
          <StaggerItem key={project.full_name}>
            <a
              className="block h-full"
              href={project.html_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <CardSpotlight
                className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70 backdrop-blur transition-colors duration-500"
                glowColor="148, 163, 184"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-slate-900">
                      {project.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {project.full_name}
                    </p>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">
                  {project.description || "暂无描述"}
                </p>

                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  {project.language && (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: LANGUAGE_COLORS[project.language] || "#8b8b8b" }}
                      />
                      {project.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <StarIcon />
                    {formatCount(project.stars_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ForkIcon />
                    {formatCount(project.forks_count)}
                  </span>
                </div>
              </CardSpotlight>
            </a>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </ScrollReveal>
  );
}
