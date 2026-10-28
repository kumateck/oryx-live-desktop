import type { MouseEvent, ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export function SortHeaderButton({ direction, onToggle, children }: {
  direction: false | "asc" | "desc";
  onToggle: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined;
  children: ReactNode;
}) {
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
  return <button type="button" onClick={onToggle}
    className="-mx-1 inline-flex max-w-full items-center gap-1.5 rounded px-1 py-0.5 text-left font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
    <span className="min-w-0 break-words">{children}</span>
    <Icon aria-hidden="true" className={`size-3.5 shrink-0 ${direction ? "" : "opacity-50"}`} />
  </button>;
}
