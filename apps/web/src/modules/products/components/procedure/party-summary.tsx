import { Shield, User, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ProcedureParty } from "../../lib/procedure";

/** How many users and roles are responsible for a step; opens the full list with each one's instruction. */
export function PartySummary({ parties, operation }: { parties: readonly ProcedureParty[]; operation: string }) {
  if (parties.length === 0) return <span className="text-xs text-muted-foreground">Nobody assigned</span>;
  const roles = parties.filter((item) => item.kind === "role").length;
  const users = parties.length - roles;
  const summary = [users ? `${users} ${users === 1 ? "user" : "users"}` : "", roles ? `${roles} ${roles === 1 ? "role" : "roles"}` : ""].filter(Boolean).join(", ");
  return <Popover>
    <PopoverTrigger className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium underline-offset-2 hover:bg-accent hover:underline"
      aria-label={`Responsible for ${operation}: ${summary}`}><Users className="size-3.5 text-muted-foreground" />{summary}</PopoverTrigger>
    <PopoverContent align="start" className="w-80 space-y-2">
      <h4 className="text-sm font-semibold">Responsible for {operation}</h4>
      <ul className="max-h-72 space-y-2 overflow-y-auto">
        {parties.map((item) => <li key={`${item.kind}:${item.who.value}:${item.action.value}`} className="flex gap-2 rounded-md border p-2 text-xs">
          {item.kind === "role" ? <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
          <div className="min-w-0 space-y-0.5">
            <div className="break-words font-medium">{item.who.label} <span className="font-normal text-muted-foreground">({item.kind})</span></div>
            <div className="text-muted-foreground">{item.action.label}</div>
            {item.ard ? <div className="break-words text-muted-foreground">Analytical raw data: {item.ard.label}</div> : null}
          </div>
        </li>)}
      </ul>
    </PopoverContent>
  </Popover>;
}
