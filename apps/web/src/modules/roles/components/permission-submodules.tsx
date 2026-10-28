import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accessCount, type PermissionItem } from "../lib/permission-groups";

export function PermissionSubmodules({ groups, selected, onChange }: {
  groups: ReadonlyMap<string, readonly PermissionItem[]>;
  selected: string;
  onChange: (name: string) => void;
}) {
  return <>
    <div className="border-b bg-muted/40 p-2 @min-[540px]:hidden">
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger aria-label="Permission submodule" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{Array.from(groups, ([name, children]) => <SelectItem key={name} value={name}>{name} ({accessCount(children)}/{children.length})</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <aside aria-label="Permission submodules" className="hidden min-h-0 flex-col border-r bg-muted/40 @min-[540px]:flex">
      <h4 className="shrink-0 border-b px-3 py-3 text-xs font-medium text-muted-foreground">Submodules</h4>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <TabsList aria-label="Permission submodules" className="flex h-auto w-full flex-col items-stretch justify-start gap-1 bg-transparent p-0">
          {Array.from(groups, ([name, children]) => <TabsTrigger key={name} value={name}
            aria-label={`${name}, ${accessCount(children)} of ${children.length} enabled`}
            className="flex h-auto min-h-8 w-full flex-none items-center justify-start gap-2 px-2 py-2 text-left whitespace-normal data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <span className="min-w-0 flex-1 break-words text-left">{name}</span><span className="ml-auto shrink-0 text-right text-sm tabular-nums opacity-70">{accessCount(children)}/{children.length}</span>
          </TabsTrigger>)}
        </TabsList>
      </div>
    </aside>
  </>;
}
