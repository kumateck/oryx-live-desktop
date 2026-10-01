import type { UserRow } from "../schemas/user-schema";
import { ChangeRoleDialog } from "./change-role-dialog";
import { ToggleUserDialog } from "./toggle-user-dialog";
import { UserDetailsDialog } from "./user-details-dialog";
import type { UserAction } from "./user-row-actions";

export interface OpenUserAction { action: UserAction; user: UserRow }

/** The dialog for the action chosen on a row. Kept above the table so a list refresh does not close it. */
export function UserDialogs({ open, onClose }: { open: OpenUserAction | null; onClose: () => void }) {
  if (!open) return null;
  if (open.action === "role") return <ChangeRoleDialog key={open.user.id} user={open.user} onClose={onClose} />;
  if (open.action === "toggle") return <ToggleUserDialog key={open.user.id} user={open.user} onClose={onClose} />;
  return <UserDetailsDialog user={open.user} onClose={onClose} />;
}
