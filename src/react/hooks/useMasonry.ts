import { useState, useEffect, useRef, useCallback } from 'react';

interface MasonryItem {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface UseMasonryOptions {
  columnCount?: number;
  gap?: number;
}

export function useMasonry(
  itemCount: number,
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseMasonryOptions = {}
) {
  const { gap = 16 } = options;
  const [positions, setPositions] = useState<MasonryItem[]>([]);
  const [containerHeight, setContainerHeight] = useState(0);

  const calculate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    // Auto-detect columns based on width
    const columnCount = options.columnCount || (containerWidth >= 1024 ? 3 : containerWidth >= 640 ? 2 : 1);
    const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
    const columnHeights = new Array(columnCount).fill(0);

    const newPositions: MasonryItem[] = children.map((child, i) => {
      // Find shortest column
      const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));
      const x = shortestCol * (columnWidth + gap);
      const y = columnHeights[shortestCol];

      // Measure actual child height (or estimate)
      const height = child.offsetHeight || 200;

      columnHeights[shortestCol] = y + height + gap;

      return { width: columnWidth, height, x, y };
    });

    setPositions(newPositions);
    setContainerHeight(Math.max(...columnHeights));
  }, [containerRef, gap, options.columnCount, itemCount]);

  useEffect(() => {
    calculate();

    const observer = new ResizeObserver(() => {
      calculate();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [calculate, containerRef]);

  return { positions, containerHeight };
}
