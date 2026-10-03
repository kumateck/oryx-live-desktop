import { memo } from "react";
import { Switch } from "@/components/ui/switch";
import type { PermissionRow } from "../lib/permission-groups";

/** One permission and its switch. Redrawn only when that permission changes, not when another switch is flipped. */
const PermissionLine = memo(function PermissionLine({ row, showPath, disabled, onToggle }: { row: PermissionRow; showPath: boolean; disabled: boolean; onToggle: (key: string, enabled: boolean) => void }) {
  const { item } = row;
  const id = `permission-${item.key}`;
  return <div className="grid grid-cols-[minmax(0,1fr)_96px]">
    <label htmlFor={id} className="min-w-0 cursor-pointer px-4 py-3">
      <span id={`${id}-name`} className="block break-words text-sm font-medium">{item.name || item.key}</span>
      {showPath ? <span className="block text-[11px] text-muted-foreground">{row.module}{item.subModule ? ` › ${item.subModule}` : ""}</span> : null}
      {item.description ? <span id={`${id}-description`} className="mt-0.5 block break-words text-xs text-muted-foreground">{item.description}</span> : null}
    </label>
    <div className="flex items-start border-l px-4 py-3"><Switch id={id} checked={item.types.includes("Access")} disabled={disabled} aria-labelledby={`${id}-name`}
      aria-describedby={item.description ? `${id}-description` : undefined} onCheckedChange={(enabled) => onToggle(item.key, enabled)} /></div>
  </div>;
});

export function PermissionItems({ rows, showPath, disabled, onToggle }: { rows: readonly PermissionRow[]; showPath: boolean; disabled: boolean; onToggle: (key: string, enabled: boolean) => void }) {
  return <div className="divide-y">{rows.map((row) => <PermissionLine key={`${row.module}-${row.item.key}`} row={row} showPath={showPath} disabled={disabled} onToggle={onToggle} />)}</div>;
}
