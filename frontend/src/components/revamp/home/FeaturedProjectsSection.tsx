import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { GithubProject } from "../../../api/home";
import { CardSpotlight } from "../../ui/CardSpotlight";
import { SectionTitleCard } from "../shared/SectionTitleCard";

type PointerLine = {
  id: string;
  d: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

function resolveLines(
  section: HTMLDivElement,
  card: HTMLElement,
  techList: string[],
  techCardElements: Map<string, HTMLDivElement>,
): PointerLine[] {
  const sectionRect = section.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const startX = cardRect.left + cardRect.width / 2 - sectionRect.left;
  const startY = cardRect.bottom - sectionRect.top - 6;

  return techList
    .map((tech) => {
      const techCard = techCardElements.get(tech);
      if (!techCard) {
        return null;
      }
      const techRect = techCard.getBoundingClientRect();
      const endX = techRect.left + techRect.width / 2 - sectionRect.left;
      const endY = techRect.top - sectionRect.top + 8;
      const middleOffset = Math.max(52, Math.abs(endX - startX) * 0.18 + 44);
      return {
        id: `${tech}-${Math.round(startX)}-${Math.round(endX)}`,
        d: `M ${startX} ${startY} C ${startX} ${startY + middleOffset}, ${endX} ${endY - middleOffset}, ${endX} ${endY}`,
        startX,
        startY,
        endX,
        endY,
      } satisfies PointerLine;
    })
    .filter((line): line is PointerLine => Boolean(line));
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

type InternalProject = {
  id: string;
  name: string;
  summary: string;
  summary_zh: string;
  repo_path: string;
  detail: string;
  detail_zh: string;
  href: string;
  tech_stack: string[];
};

function toInternalProjects(projects: GithubProject[]): InternalProject[] {
  return projects.map((p) => ({
    id: `proj-${p.full_name.replace("/", "-")}`,
    name: p.name,
    summary: p.description,
    summary_zh: p.description_zh,
    repo_path: p.full_name,
    detail: p.detail_en,
    detail_zh: p.detail_zh,
    href: p.html_url,
    tech_stack: p.tech_stack,
  }));
}

export function FeaturedProjectsSection({ projects }: { projects: GithubProject[] }) {
  const gradientScopeId = useId().replace(/:/g, "");
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cardRefMap = useRef<Map<string, HTMLElement>>(new Map());
  const techCardRefMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const [hoveredProjectId, setHoveredProjectId] = useState<string>("");
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);
  const [pointerLines, setPointerLines] = useState<PointerLine[]>([]);
  const [isDesktopInteractive, setIsDesktopInteractive] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const internalProjects = useMemo(() => toInternalProjects(projects), [projects]);

  const featuredTechStack = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      for (const t of p.tech_stack) {
        set.add(t);
      }
    }
    return Array.from(set);
  }, [projects]);

  const hoveredProject = useMemo(
    () => internalProjects.find((project) => project.id === hoveredProjectId) ?? null,
    [hoveredProjectId, internalProjects],
  );
  const activeTechStack = hoveredProject?.tech_stack ?? [];

  const techUsage = useMemo(() => {
    const techCountMap = new Map<string, number>();
    for (const tech of featuredTechStack) {
      techCountMap.set(tech, 0);
    }
    for (const project of internalProjects) {
      for (const tech of project.tech_stack) {
        techCountMap.set(tech, (techCountMap.get(tech) ?? 0) + 1);
      }
    }
    const maxCount = Math.max(...Array.from(techCountMap.values()), 1);
    return featuredTechStack.map((tech) => {
      const count = techCountMap.get(tech) ?? 0;
      return {
        name: tech,
        percent: Math.round((count / maxCount) * 100),
      };
    });
  }, [featuredTechStack, internalProjects]);

  useEffect(() => {
    const hoverMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
    const desktopMedia = window.matchMedia("(min-width: 768px)");
    const reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateCapabilities = () => {
      setIsDesktopInteractive(hoverMedia.matches && desktopMedia.matches);
      setPrefersReducedMotion(reduceMotionMedia.matches);
    };

    updateCapabilities();
    hoverMedia.addEventListener("change", updateCapabilities);
    desktopMedia.addEventListener("change", updateCapabilities);
    reduceMotionMedia.addEventListener("change", updateCapabilities);

    return () => {
      hoverMedia.removeEventListener("change", updateCapabilities);
      desktopMedia.removeEventListener("change", updateCapabilities);
      reduceMotionMedia.removeEventListener("change", updateCapabilities);
    };
  }, []);

  const refreshPointerLines = useCallback(() => {
    if (!hoveredProject || !isDesktopInteractive) {
      setPointerLines([]);
      return;
    }
    const section = sectionRef.current;
    const card = cardRefMap.current.get(hoveredProject.id);
    if (!section || !card) {
      setPointerLines([]);
      return;
    }
    setPointerLines(resolveLines(section, card, hoveredProject.tech_stack, techCardRefMap.current));
  }, [hoveredProject, isDesktopInteractive]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(refreshPointerLines);
    return () => window.cancelAnimationFrame(rafId);
  }, [refreshPointerLines]);

  useEffect(() => {
    if (!hoveredProject || !isDesktopInteractive) {
      return;
    }
    const onResizeOrScroll = () => refreshPointerLines();
    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll);
    };
  }, [hoveredProject, isDesktopInteractive, refreshPointerLines]);

  const shouldRenderBeam = isDesktopInteractive && pointerLines.length > 0;

  if (internalProjects.length === 0) {
    return null;
  }

  return (
    <section id="projects" className="space-y-6">
      <SectionTitleCard category="Code" title="开源项目" accentColor="#c96442" tagline="写代码是一种表达，开源是把想法交给世界。" />

      <div ref={sectionRef} className="relative space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {internalProjects.map((project) => {
            const active = hoveredProjectId === project.id;
            const techDimmed = hoveredTech !== null && !project.tech_stack.includes(hoveredTech);
            return (
              <motion.article
                key={project.id}
                ref={(node) => {
                  if (node) {
                    cardRefMap.current.set(project.id, node);
                    return;
                  }
                  cardRefMap.current.delete(project.id);
                }}
                tabIndex={0}
                role="link"
                aria-label={`Open ${project.name} on GitHub`}
                onMouseEnter={() => {
                  if (!isDesktopInteractive) {
                    return;
                  }
                  setHoveredProjectId(project.id);
                }}
                onMouseLeave={() => {
                  if (!isDesktopInteractive) {
                    return;
                  }
                  setHoveredProjectId((prev) => (prev === project.id ? "" : prev));
                }}
                onClick={() => {
                  if (isDesktopInteractive) {
                    window.open(project.href, "_blank", "noopener,noreferrer");
                    return;
                  }
                  setHoveredProjectId((prev) => {
                    if (prev === project.id) {
                      window.open(project.href, "_blank", "noopener,noreferrer");
                      return "";
                    }
                    return project.id;
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }
                  event.preventDefault();
                  window.open(project.href, "_blank", "noopener,noreferrer");
                }}
                onFocusCapture={() => setHoveredProjectId(project.id)}
                onBlurCapture={(event) => {
                  const nextFocusTarget = event.relatedTarget;
                  if (nextFocusTarget instanceof Node && event.currentTarget.contains(nextFocusTarget)) {
                    return;
                  }
                  setHoveredProjectId((prev) => (prev === project.id ? "" : prev));
                }}
                animate={{ opacity: techDimmed ? 0.35 : 1 }}
                transition={{ duration: 0.2 }}
                className={`group relative z-20 h-full cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                  hoveredTech && !techDimmed ? "ring-2 ring-orange-400" : ""
                }`}
              >
                <CardSpotlight
                  glowColor={active ? "255,255,255" : "148,163,184"}
                  className={`h-full rounded-2xl border p-4 transition duration-300 ${
                    active
                      ? "border-claude-terracotta bg-claude-near-black shadow-whisper-lg"
                      : "border-slate-200/75 bg-claude-ivory shadow-[0_10px_22px_rgba(15,23,42,0.1)] group-hover:border-claude-terracotta group-hover:bg-claude-near-black group-hover:shadow-whisper-lg"
                  }`}
                >
                  <div className="relative z-20 flex h-full flex-col">
                    <h3 className={`mt-1 text-lg font-semibold ${active ? "text-white" : "text-slate-800 group-hover:text-white"}`}>
                      {project.name}
                    </h3>
                    <p className={`mt-3 text-sm leading-6 ${active ? "text-slate-100/95" : "text-slate-600 group-hover:text-slate-100/95"}`}>
                      {active ? project.summary_zh : project.summary}
                    </p>
                    <div className="mt-3">
                      <p className={`text-[11px] uppercase tracking-[0.14em] ${active ? "text-claude-coral/95" : "text-slate-500 group-hover:text-claude-coral/95"}`}>
                        Repository
                      </p>
                      <p className={`mt-1 font-mono text-xs ${active ? "text-claude-coral/95" : "text-slate-600 group-hover:text-claude-coral/95"}`}>
                        {project.repo_path}
                      </p>
                      <p className={`mt-1 text-xs leading-5 ${active ? "text-slate-200/95" : "text-slate-500 group-hover:text-slate-200/95"}`}>
                        {active ? project.detail_zh : project.detail}
                      </p>
                    </div>
                    <div className="mt-auto pt-4">
                      <div
                        className={`inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${
                          active
                            ? "translate-x-0 text-white"
                            : "translate-x-0 text-slate-500 group-hover:translate-x-1 group-hover:text-white"
                        }`}
                      >
                        Open on GitHub
                        <ArrowRightIcon />
                      </div>
                    </div>
                  </div>
                </CardSpotlight>
              </motion.article>
            );
          })}
        </div>

        <AnimatePresence>
          {shouldRenderBeam ? (
            <motion.svg
              key={hoveredProjectId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="pointer-events-none absolute inset-0 z-10 hidden md:block"
            >
              <defs>
                {pointerLines.map((line) => {
                  const gradientId = `beam-${gradientScopeId}-${line.id}`;
                  if (prefersReducedMotion) {
                    return (
                      <linearGradient
                        key={gradientId}
                        id={gradientId}
                        gradientUnits="userSpaceOnUse"
                        x1={line.startX}
                        y1={line.startY}
                        x2={line.endX}
                        y2={line.endY}
                      >
                        <stop stopColor="#3b82f6" stopOpacity="0" />
                        <stop offset="0.45" stopColor="#3b82f6" />
                        <stop offset="1" stopColor="#38bdf8" />
                      </linearGradient>
                    );
                  }
                  return (
                    <motion.linearGradient
                      key={gradientId}
                      id={gradientId}
                      gradientUnits="userSpaceOnUse"
                      x1={line.startX}
                      y1={line.startY}
                      x2={line.endX}
                      y2={line.endY}
                      initial={{ x1: line.startX, x2: line.startX }}
                      animate={{ x1: [line.startX, line.endX], x2: [line.startX + 40, line.endX + 40] }}
                      transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <stop stopColor="#3b82f6" stopOpacity="0" />
                      <stop offset="0.35" stopColor="#3b82f6" />
                      <stop offset="0.72" stopColor="#38bdf8" />
                      <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
                    </motion.linearGradient>
                  );
                })}
              </defs>

              {pointerLines.map((line) => {
                const gradientId = `beam-${gradientScopeId}-${line.id}`;
                const initialMotion = prefersReducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 };
                const animateMotion = prefersReducedMotion ? { opacity: 1 } : { pathLength: 1, opacity: 1 };
                const exitMotion = prefersReducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 };
                return (
                  <g key={line.id}>
                    <motion.path
                      d={line.d}
                      stroke="rgba(59,130,246,0.24)"
                      strokeWidth={2.2}
                      fill="none"
                      strokeLinecap="round"
                      initial={initialMotion}
                      animate={animateMotion}
                      exit={exitMotion}
                      transition={{ duration: 0.24, ease: "easeOut" }}
                    />
                    <motion.path
                      d={line.d}
                      stroke={`url(#${gradientId})`}
                      strokeWidth={2.2}
                      fill="none"
                      strokeLinecap="round"
                      initial={initialMotion}
                      animate={animateMotion}
                      exit={exitMotion}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    />
                  </g>
                );
              })}
            </motion.svg>
          ) : null}
        </AnimatePresence>

        <div className="relative z-20 rounded-2xl border border-slate-200/80 bg-claude-ivory p-4 shadow-whisper">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tech Stack</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {techUsage.map((tech) => {
              const activeFromProject = activeTechStack.includes(tech.name);
              const activeFromHover = hoveredTech === tech.name;
              const active = activeFromProject || activeFromHover;
              return (
                <div
                  key={tech.name}
                  ref={(node) => {
                    if (node) {
                      techCardRefMap.current.set(tech.name, node);
                      return;
                    }
                    techCardRefMap.current.delete(tech.name);
                  }}
                  onMouseEnter={() => isDesktopInteractive && setHoveredTech(tech.name)}
                  onMouseLeave={() => isDesktopInteractive && setHoveredTech(null)}
                  className={`rounded-2xl border p-4 transition cursor-default ${
                    active
                      ? "border-claude-terracotta/60 bg-claude-warm-sand shadow-[0_0_0_1px_rgba(251,146,60,0.26),0_10px_24px_rgba(251,146,60,0.16)]"
                      : "border-slate-200/90 bg-claude-ivory shadow-whisper"
                  }`}
                >
                  <p className={`text-sm font-semibold ${active ? "text-claude-terracotta" : "text-slate-700"}`}>{tech.name}</p>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200/75">
                    <motion.div
                      className={`h-full rounded-full ${active ? "bg-gradient-to-r from-orange-500 to-amber-400" : "bg-slate-400/75"}`}
                      initial={false}
                      animate={{ width: `${tech.percent}%` }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.32, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
