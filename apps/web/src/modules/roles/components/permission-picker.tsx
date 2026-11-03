import { LockKeyhole, LockKeyholeOpen, Search, X } from "lucide-react";
import type { PermissionModule } from "../schemas/permission-schema";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { accessCount } from "../lib/permission-groups";
import { usePermissionPicker } from "../hooks/use-permission-picker";
import { PermissionResults } from "./permission-results";
import { PermissionModuleTabs } from "./permission-module-tabs";
import { PermissionSubmodules } from "./permission-submodules";

interface PermissionPickerProps {
  modules: PermissionModule[];
  onChange: (next: PermissionModule[]) => void;
  disabled?: boolean;
  fill?: boolean;
}

/**
 * The permission editor: modules across the top, the open module's submodules down the left, and its
 * permissions with their switches on the right. A search looks through every module at once.
 */
export function PermissionPicker({ modules, onChange, disabled = false, fill = false }: PermissionPickerProps) {
  const { selected, groups, group, search, setSearch, searching, visible, total, change, toggle, chooseModule, chooseGroup } = usePermissionPicker(modules, onChange, disabled);
  const Lock = selected?.isActive ? LockKeyholeOpen : LockKeyhole;

  return <section aria-label="Role permissions" className={`@container flex min-h-0 min-w-0 flex-col rounded-lg border bg-card p-4 ${fill ? "flex-1" : ""}`}>
    <Tabs value={selected?.module ?? ""} onValueChange={chooseModule} className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <PermissionModuleTabs modules={modules} onSelect={chooseModule} />
      {selected ? <TabsContent value={selected.module} className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-base font-semibold">{searching ? "Search results" : selected.module}</h2><p className="text-xs text-muted-foreground">{searching
            ? `${visible.length} matching permissions across all modules · ${total} selected overall`
            : `${accessCount(selected.children)} of ${selected.children.length} enabled · ${total} selected overall`}</p></div>
          {searching ? null : <label className="flex items-center gap-2 text-sm"><Lock aria-hidden="true" className="size-4" /><span>{selected.isActive ? "Access" : "No access"}</span>
            <Switch aria-label={`${selected.module} module access`} checked={selected.isActive} disabled={disabled || !selected.children.length}
              onCheckedChange={(enabled) => change(new Set(selected.children.map((child) => child.key)), enabled)} />
          </label>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="relative min-w-40 flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search permissions in every module" placeholder="Search every module by name, description or key" className="pl-8 pr-8" value={search} onChange={(event) => setSearch(event.target.value)} />
            {search ? <button type="button" aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground" onClick={() => setSearch("")}><X className="size-4" /></button> : null}</div>
          <span role="status" className="text-xs text-muted-foreground">{visible.length} shown{searching ? " across all modules" : ""}</span>
        </div>
        {searching ? <section key={`search:${search.trim()}`} aria-label="Permission search results" className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border ${fill ? "flex-1" : "h-96"}`}>
          <PermissionResults rows={visible} searching disabled={disabled} onToggle={toggle} />
        </section> : <Tabs orientation="vertical" value={group} onValueChange={chooseGroup}
          className={`grid min-h-0 min-w-0 grid-cols-1 gap-0 overflow-hidden rounded-lg border @min-[540px]:grid-cols-[minmax(160px,1fr)_minmax(0,3fr)] ${fill ? "flex-1" : "h-96"}`}>
          <PermissionSubmodules groups={groups} selected={group} onChange={chooseGroup} />
          <TabsContent key={`${selected.module}:${group}`} value={group} className="flex min-h-0 min-w-0 flex-1 flex-col">
            <PermissionResults rows={visible} searching={false} disabled={disabled} onToggle={toggle} />
          </TabsContent>
        </Tabs>}
      </TabsContent> : <p className="p-6 text-sm text-muted-foreground">No permission modules available.</p>}
    </Tabs>
  </section>;
}
