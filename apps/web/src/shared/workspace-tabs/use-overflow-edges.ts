import { useEffect, useState, type RefObject } from "react";

/** Whether a horizontal scroller has hidden content on either side, for edge fades. */
export function useOverflowEdges(ref: RefObject<HTMLElement | null>, revision: number): { start: boolean; end: boolean } {
  const [edges, setEdges] = useState({ start: false, end: false });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const start = element.scrollLeft > 1;
      const end = element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
      setEdges((current) => current.start === start && current.end === end ? current : { start, end });
    };
    measure();
    element.addEventListener("scroll", measure, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => { element.removeEventListener("scroll", measure); observer?.disconnect(); };
  }, [ref, revision]);
  return edges;
}
