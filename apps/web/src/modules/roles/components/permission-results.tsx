import type { PermissionRow } from "../lib/permission-groups";
import { PermissionItems } from "./permission-items";

/** The same permission rows in a labelled global search or a selected submodule. */
export function PermissionResults({ rows, searching, disabled, onToggle }: {
  rows: readonly PermissionRow[]; searching: boolean; disabled: boolean; onToggle: (key: string, enabled: boolean) => void;
}) {
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
    <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_96px] border-b bg-muted/40 text-xs font-medium text-muted-foreground">
      <h3 className="px-4 py-3">{searching ? "Matching items in every module" : "Items"}</h3><h3 className="border-l px-4 py-3">Access</h3>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto [&>div>div]:[content-visibility:auto] [&>div>div]:[contain-intrinsic-size:auto_56px]">
      {rows.length ? <PermissionItems rows={rows} showPath={searching} disabled={disabled} onToggle={onToggle} />
        : <p className="p-8 text-center text-sm text-muted-foreground">{searching ? "No permission matches this search." : "No permissions in this group."}</p>}
    </div>
  </div>;
}
