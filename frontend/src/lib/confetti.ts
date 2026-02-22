function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function getConfettiOriginFromElement(element: HTMLElement) {
  if (typeof window === "undefined") {
    return { x: 0.5, y: 0.5 };
  }

  const rect = element.getBoundingClientRect();
  const viewportWidth = Math.max(window.innerWidth, 1);
  const viewportHeight = Math.max(window.innerHeight, 1);
  return {
    x: clamp01((rect.left + rect.width / 2) / viewportWidth),
    y: clamp01((rect.top + rect.height / 2) / viewportHeight),
  };
}
