import { useId, type KeyboardEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { cn } from "cn";

export interface TabItem<TId extends string> { id: TId; label: string }

/** The open tab, kept in the address as ?tab= so it survives reload, back and forward, and can be linked. */
export function useTabParam<TId extends string>(tabs: readonly TabItem<TId>[], fallback: TId, param = "tab") {
  const [params, setParams] = useSearchParams();
  const requested = params.get(param);
  const active = tabs.find((tab) => tab.id === requested)?.id ?? fallback;
  const select = (id: TId) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (id === fallback) next.delete(param); else next.set(param, id);
    return next;
  }, { replace: true });
  return [active, select] as const;
}

/** Tab strip with arrow-key navigation. Only the active panel is rendered, so its data loads when opened. */
export function Tabs<TId extends string>({ label, tabs, active, onSelect, children }: {
  label: string;
  tabs: readonly TabItem<TId>[];
  active: TId;
  onSelect: (id: TId) => void;
  children: ReactNode;
}) {
  const base = useId();
  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === active);
    const next = tabs[(index + step + tabs.length) % tabs.length];
    if (!next) return;
    onSelect(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  };
  return <div className="min-w-0 ui-card-flush border bg-card">
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-x-5 gap-y-1 border-b px-card">
      {tabs.map((tab) => <button key={tab.id} id={`${base}-tab-${tab.id}`} type="button" role="tab" aria-selected={tab.id === active}
        aria-controls={`${base}-panel`} tabIndex={tab.id === active ? 0 : -1} onClick={() => onSelect(tab.id)} onKeyDown={move}
        className={cn("-mb-px border-b-2 py-2.5 text-sm font-medium focus-visible:outline-2",
          tab.id === active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab.label}</button>)}
    </div>
    <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`} className="min-w-0 p-card">{children}</div>
  </div>;
}
