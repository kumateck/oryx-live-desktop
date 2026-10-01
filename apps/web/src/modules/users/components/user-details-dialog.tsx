import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/shared/auth/user-avatar";
import type { UserRow } from "../schemas/user-schema";

function joined(value: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function UserDetailsDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>User details</DialogTitle><DialogDescription>Account information for this user.</DialogDescription></DialogHeader>
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar user={user} size="lg" />
        <div className="min-w-0"><p className="break-words font-semibold">{user.name}</p>
          <p className="break-words text-sm text-muted-foreground">{user.email || "No email address"}</p></div>
        <Badge variant={user.isDisabled ? "destructive" : "secondary"} className="ml-auto shrink-0">{user.isDisabled ? "Blocked" : "Active"}</Badge>
      </div>
      <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Role</dt><dd className="break-words">{user.role?.displayName || user.role?.name || "No role"}</dd>
        <dt className="text-muted-foreground">Department</dt><dd className="break-words">{user.department ?? "No department"}</dd>
        <dt className="text-muted-foreground">Account created</dt><dd>{joined(user.createdAt)}</dd>
      </dl>
    </DialogContent>
  </Dialog>;
}
