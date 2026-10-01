import { useLayoutEffect, useRef, useState } from "react";
import { fitSelectedLabels } from "./select-option";
import type { SelectOption } from "./form-wizard-types";

export function useVisibleSelectLabels(selected: readonly SelectOption[]) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const measure = measureRef.current;
    if (!trigger || !measure) return;
    const update = () => {
      const widths = Array.from(measure.children, (child) => child.getBoundingClientRect().width);
      setVisibleCount(fitSelectedLabels(widths, Math.max(0, trigger.clientWidth - 12)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [selected]);

  return { triggerRef, measureRef, visibleCount };
}
