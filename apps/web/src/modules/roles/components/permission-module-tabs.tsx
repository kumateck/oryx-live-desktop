import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { accessCount } from "../lib/permission-groups";
import type { PermissionModule } from "../schemas/permission-schema";

const codes: Readonly<Record<string, string>> = { Procurement: "PR", Production: "PD", Logistics: "LG", Reports: "RP", Warehouse: "WH", "Finished Goods Warehouse": "FG", "Service and Store Procurement": "SP", "IT Support": "IT" };
/** A short code for a module: a fixed one where two would clash, otherwise its initials. */
export function moduleCode(name: string): string {
  if (codes[name]) return codes[name];
  const words = name.match(/[A-Za-z0-9]+/g) ?? [];
  return words.length > 1 ? words.map((word) => word[0]).join("").slice(0, 3).toUpperCase() : name.slice(0, 2).toUpperCase();
}

/** The modules as short codes; the full name and how much of the module is granted show on hover and are read out. */
export function PermissionModuleTabs({ modules }: { modules: readonly PermissionModule[] }) {
  return <TabsList aria-label="Permission modules" className="h-auto w-full shrink-0 flex-wrap justify-start gap-1 border">
    {modules.map((module) => <Tooltip key={module.module}>
      <TooltipTrigger asChild><span className="inline-flex"><TabsTrigger value={module.module} aria-label={module.module}
        className="h-7 flex-none px-2 text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">{moduleCode(module.module)}</TabsTrigger></span></TooltipTrigger>
      <TooltipContent>{module.module} · {accessCount(module.children)}/{module.children.length} enabled</TooltipContent>
    </Tooltip>)}
  </TabsList>;
}
