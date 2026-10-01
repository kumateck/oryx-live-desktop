import { cn } from "cn";
import type { UserStatus } from "../lib/user-access";

const labels: Record<UserStatus, string> = { active: "Active", inactive: "Inactive" };

export function UserStatusTabs({ statuses, status, onChange }: {
  statuses: readonly UserStatus[];
  status: UserStatus;
  onChange: (status: UserStatus) => void;
}) {
  if (statuses.length < 2) return null;
  return <div role="tablist" aria-label="User status" className="inline-flex rounded-lg border bg-card p-0.5">
    {statuses.map((item) => <button key={item} type="button" role="tab" aria-selected={item === status} onClick={() => onChange(item)}
      className={cn("rounded-md px-3 py-1 text-sm font-medium focus-visible:outline-2",
        item === status ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{labels[item]}</button>)}
  </div>;
}
