import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";

/** A two-way filter kept in the address as `?show=`: what is waiting (the default) and what is already done. */
export function useDoneFilter(doneId: string) {
  const [params, setParams] = useSearchParams();
  const done = params.get("show") === doneId;
  const select = useCallback((next: boolean) => setParams((current) => {
    const updated = new URLSearchParams(current);
    if (next) updated.set("show", doneId); else updated.delete("show");
    return updated;
  }, { replace: true }), [setParams, doneId]);
  return { done, select };
}

export function DoneFilter({ label, waiting, done, value, onSelect }: { label: string; waiting: string; done: string; value: boolean; onSelect: (done: boolean) => void }) {
  return <div role="group" aria-label={label} className="flex gap-1">
    <Button type="button" size="sm" variant={value ? "outline" : "default"} aria-pressed={!value} onClick={() => onSelect(false)}>{waiting}</Button>
    <Button type="button" size="sm" variant={value ? "default" : "outline"} aria-pressed={value} onClick={() => onSelect(true)}>{done}</Button>
  </div>;
}
