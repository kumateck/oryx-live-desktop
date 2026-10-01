import { useId, useMemo, useState } from "react";
import type { PermissionModule } from "../schemas/permission-schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toggleAccess } from "../lib/permissions";

interface PermissionPickerProps {
  modules: PermissionModule[];
  onChange: (next: PermissionModule[]) => void;
  disabled?: boolean;
}

export function PermissionPicker({ modules, onChange, disabled = false }: PermissionPickerProps) {
  const id = useId();
  const [moduleIndex, setModuleIndex] = useState("0");
  const [search, setSearch] = useState("");
  const selected = modules[Number(moduleIndex)];
  const children = useMemo(() => (selected?.children ?? []).filter((child) =>
    `${child.name ?? ""} ${child.description ?? ""} ${child.subModule ?? ""}`.toLowerCase().includes(search.toLowerCase())),
    [selected, search]);
  const count = modules.reduce((sum, module) => sum + module.children.filter((child) => child.types.includes("Access")).length, 0);

  return <section aria-label="Role permissions" className="min-w-0 space-y-4 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-base font-semibold">Permissions</h2><p className="text-sm text-muted-foreground">{count} permissions selected</p></div>
      <Select value={moduleIndex} onValueChange={(value) => { setModuleIndex(value); setSearch(""); }}>
        <SelectTrigger aria-label="Permission module" className="min-w-44 max-w-full"><SelectValue placeholder="Choose module" /></SelectTrigger>
        <SelectContent>{modules.map((module, index) =>
          <SelectItem key={module.module} value={String(index)}>{module.module}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <Input aria-label="Search permissions in module" placeholder="Find a permission" value={search} onChange={(event) => setSearch(event.target.value)} />
    <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
      {children.length ? children.map((child, index) => {
        const inputId = `${id}-${moduleIndex}-${index}`;
        const checked = child.types.includes("Access");
        return <label key={child.key} htmlFor={inputId} className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
          <Checkbox id={inputId} checked={checked} disabled={disabled}
            onCheckedChange={() => onChange(toggleAccess(modules, child.key))} />
          <span className="min-w-0"><span className="block text-sm font-medium">{child.name || child.key}</span>
            {child.description ? <span className="block text-xs text-muted-foreground">{child.description}</span> : null}</span>
        </label>;
      }) : <p className="py-6 text-center text-sm text-muted-foreground">No matching permissions.</p>}
    </div>
  </section>;
}
