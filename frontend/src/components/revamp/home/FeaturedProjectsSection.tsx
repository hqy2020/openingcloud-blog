import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { featuredProjects, featuredTechStack } from "../../../data/revamp/featuredProjects";
import { CardSpotlight } from "../../ui/CardSpotlight";
import { CardBody, CardContainer, CardItem } from "../../ui/ThreeDCard";

type PointerLine = {
  id: string;
  d: string;
};

function resolveLines(
  section: HTMLDivElement,
  card: HTMLElement,
  techList: string[],
  chipElements: Map<string, HTMLButtonElement>,
): PointerLine[] {
  const sectionRect = section.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const startX = cardRect.left + cardRect.width / 2 - sectionRect.left;
  const startY = cardRect.bottom - sectionRect.top - 8;

  return techList
    .map((tech) => {
      const chip = chipElements.get(tech);
      if (!chip) {
        return null;
      }
      const chipRect = chip.getBoundingClientRect();
      const endX = chipRect.left + chipRect.width / 2 - sectionRect.left;
      const endY = chipRect.top - sectionRect.top + 2;
      const middleOffset = Math.max(40, Math.abs(endX - startX) * 0.2 + 34);
      return {
        id: `${tech}-${Math.round(startX)}-${Math.round(endX)}`,
        d: `M ${startX} ${startY} C ${startX} ${startY + middleOffset}, ${endX} ${endY - middleOffset}, ${endX} ${endY}`,
      } satisfies PointerLine;
    })
    .filter((line): line is PointerLine => Boolean(line));
}

export function FeaturedProjectsSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cardRefMap = useRef<Map<string, HTMLElement>>(new Map());
  const chipRefMap = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [hoveredProjectId, setHoveredProjectId] = useState<string>("");
  const [pointerLines, setPointerLines] = useState<PointerLine[]>([]);

  const hoveredProject = useMemo(
    () => featuredProjects.find((project) => project.id === hoveredProjectId) ?? null,
    [hoveredProjectId],
  );
  const activeTechStack = hoveredProject?.tech_stack ?? [];

  const refreshPointerLines = useCallback(() => {
    if (!hoveredProject) {
      setPointerLines([]);
      return;
    }
    const section = sectionRef.current;
    const card = cardRefMap.current.get(hoveredProject.id);
    if (!section || !card) {
      setPointerLines([]);
      return;
    }
    setPointerLines(resolveLines(section, card, hoveredProject.tech_stack, chipRefMap.current));
  }, [hoveredProject]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(refreshPointerLines);
    return () => window.cancelAnimationFrame(rafId);
  }, [refreshPointerLines]);

  useEffect(() => {
    if (!hoveredProject) {
      return;
    }
    const onResizeOrScroll = () => refreshPointerLines();
    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll);
    };
  }, [hoveredProject, refreshPointerLines]);

  return (
    <section id="projects" className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Web Coding</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-800">项目卡与技术栈联动</h2>
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
                onMouseEnter={() => setHoveredProjectId(project.id)}
                onMouseLeave={() => setHoveredProjectId((prev) => (prev === project.id ? "" : prev))}
                className="relative"
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
                      <CardItem translateZ={24} className="w-full">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Project</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-800">{project.name}</h3>
                      </CardItem>
                      <CardItem translateZ={14} className="mt-3 w-full">
                        <p className="text-sm leading-6 text-slate-600">{project.summary}</p>
                      </CardItem>
                      <CardItem translateZ={20} className="mt-4 w-full">
                        <a
                          href={project.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex rounded-full border border-slate-300/80 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                        >
                          打开项目
                        </a>
                      </CardItem>
                    </CardSpotlight>
                  </CardBody>
                </CardContainer>
              </motion.article>
            );
          })}
        </div>

        <AnimatePresence>
          {pointerLines.length > 0 ? (
            <motion.svg
              key={hoveredProjectId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="pointer-events-none absolute inset-0 z-10 hidden md:block"
            >
              {pointerLines.map((line) => (
                <motion.path
                  key={line.id}
                  d={line.d}
                  stroke="rgba(79,106,229,0.55)"
                  strokeWidth={1.8}
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                />
              ))}
            </motion.svg>
          ) : null}
        </AnimatePresence>

        <div className="rounded-2xl border border-slate-200/80 bg-white/72 p-4 shadow-[0_12px_26px_rgba(15,23,42,0.09)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tech Stack</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {featuredTechStack.map((tech) => {
              const active = activeTechStack.includes(tech);
              return (
                <button
                  key={tech}
                  ref={(node) => {
                    if (node) {
                      chipRefMap.current.set(tech, node);
                      return;
                    }
                    chipRefMap.current.delete(tech);
                  }}
                  type="button"
                  onMouseEnter={() => {
                    if (!hoveredProject) {
                      return;
                    }
                    refreshPointerLines();
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-indigo-300 bg-indigo-100/70 text-indigo-700 shadow-[0_0_0_2px_rgba(79,106,229,0.18)]"
                      : "border-slate-200 bg-white/85 text-slate-600"
                  }`}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
