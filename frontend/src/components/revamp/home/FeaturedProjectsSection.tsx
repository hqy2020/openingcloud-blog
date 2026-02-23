import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { featuredProjects, featuredTechStack } from "../../../data/revamp/featuredProjects";
import { CardSpotlight } from "../../ui/CardSpotlight";
import { SparklesText } from "../../ui/SparklesText";
import { CardBody, CardContainer, CardItem } from "../../ui/ThreeDCard";

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

export function FeaturedProjectsSection() {
  const gradientScopeId = useId().replace(/:/g, "");
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cardRefMap = useRef<Map<string, HTMLElement>>(new Map());
  const techCardRefMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const [hoveredProjectId, setHoveredProjectId] = useState<string>("");
  const [pointerLines, setPointerLines] = useState<PointerLine[]>([]);
  const [isDesktopInteractive, setIsDesktopInteractive] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const hoveredProject = useMemo(
    () => featuredProjects.find((project) => project.id === hoveredProjectId) ?? null,
    [hoveredProjectId],
  );
  const activeTechStack = hoveredProject?.tech_stack ?? [];

  const techUsage = useMemo(() => {
    const techCountMap = new Map<string, number>();
    for (const tech of featuredTechStack) {
      techCountMap.set(tech, 0);
    }
    for (const project of featuredProjects) {
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
  }, []);

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

  return (
    <section id="projects" className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Code</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-800">
          <SparklesText className="text-inherit" sparklesCount={9}>
            Code
          </SparklesText>
        </h2>
      </div>

      <div ref={sectionRef} className="relative space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredProjects.map((project) => {
            const active = hoveredProjectId === project.id;
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
                className="group relative z-20 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <CardContainer containerClassName="w-full">
                  <CardBody className="w-full">
                    <CardSpotlight
                      glowColor={active ? "79,106,229" : "148,163,184"}
                      className={`h-full rounded-2xl border p-4 backdrop-blur transition duration-300 ${
                        active
                          ? "border-indigo-300/70 bg-white/90 shadow-[0_20px_34px_rgba(79,106,229,0.2)]"
                          : "border-slate-200/75 bg-white/80 shadow-[0_10px_22px_rgba(15,23,42,0.1)]"
                      }`}
                    >
                      <div
                        className={`pointer-events-none absolute inset-0 z-[1] rounded-2xl transition-opacity duration-300 ${
                          active ? "bg-slate-900/84 opacity-100" : "bg-slate-900/84 opacity-0 group-hover:opacity-100"
                        }`}
                      />
                      <div
                        className={`pointer-events-none absolute left-5 top-5 z-[2] h-2.5 w-2.5 rounded-full bg-indigo-500 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          active ? "scale-[120]" : "scale-100 group-hover:scale-[120]"
                        }`}
                      />
                      <div className="relative z-20 w-full">
                        <CardItem translateZ={24} className="w-full">
                          <h3 className={`mt-1 text-lg font-semibold ${active ? "text-white" : "text-slate-800 group-hover:text-white"}`}>
                            {project.name}
                          </h3>
                        </CardItem>
                        <CardItem translateZ={14} className="mt-3 w-full">
                          <p className={`text-sm leading-6 ${active ? "text-slate-100/95" : "text-slate-600 group-hover:text-slate-100/95"}`}>
                            {active ? project.summary_zh : project.summary}
                          </p>
                        </CardItem>
                        <CardItem translateZ={16} className="mt-3 w-full">
                          <p className={`text-[11px] uppercase tracking-[0.14em] ${active ? "text-indigo-100/95" : "text-slate-500 group-hover:text-indigo-100/95"}`}>
                            Repository
                          </p>
                          <p className={`mt-1 font-mono text-xs ${active ? "text-indigo-50/95" : "text-slate-600 group-hover:text-indigo-50/95"}`}>
                            {project.repo_path}
                          </p>
                          <p className={`mt-1 text-xs leading-5 ${active ? "text-slate-200/95" : "text-slate-500 group-hover:text-slate-200/95"}`}>
                            {active ? project.detail_zh : project.detail}
                          </p>
                        </CardItem>
                        <CardItem translateZ={20} className="mt-4 w-full">
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
                        </CardItem>
                      </div>
                    </CardSpotlight>
                  </CardBody>
                </CardContainer>
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
                        <stop stopColor="#4f6ae5" stopOpacity="0" />
                        <stop offset="0.45" stopColor="#4f6ae5" />
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
                      <stop stopColor="#4f6ae5" stopOpacity="0" />
                      <stop offset="0.35" stopColor="#4f6ae5" />
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
                      stroke="rgba(79,106,229,0.24)"
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

        <div className="relative z-20 rounded-2xl border border-slate-200/80 bg-white/72 p-4 shadow-[0_12px_26px_rgba(15,23,42,0.09)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tech Stack</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {techUsage.map((tech) => {
              const active = activeTechStack.includes(tech.name);
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
                  className={`rounded-2xl border p-4 transition ${
                    active
                      ? "border-indigo-300/90 bg-indigo-50/80 shadow-[0_0_0_1px_rgba(79,106,229,0.26),0_10px_24px_rgba(79,106,229,0.16)]"
                      : "border-slate-200/90 bg-white/88 shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                  }`}
                >
                  <p className={`text-sm font-semibold ${active ? "text-indigo-700" : "text-slate-700"}`}>{tech.name}</p>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200/75">
                    <motion.div
                      className={`h-full rounded-full ${active ? "bg-gradient-to-r from-indigo-500 to-sky-400" : "bg-slate-400/75"}`}
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
