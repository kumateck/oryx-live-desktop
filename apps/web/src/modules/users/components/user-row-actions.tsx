import { Ban, Eye, MoreHorizontal, RotateCcw, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { UserAccess } from "../hooks/use-user-access";
import type { UserRow } from "../schemas/user-schema";

export type UserAction = "details" | "role" | "toggle";

export function UserRowActions({ user, access, onAction }: {
  user: UserRow;
  access: UserAccess;
  onAction: (action: UserAction, user: UserRow) => void;
}) {
  const canToggle = user.isDisabled ? access.unblock : access.block;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button type="button" size="icon-sm" variant="ghost" aria-label={`Actions for ${user.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onSelect={() => onAction("details", user)}><Eye className="size-4" />User details</DropdownMenuItem>
      {access.edit ? <DropdownMenuItem onSelect={() => onAction("role", user)}><UserCog className="size-4" />Change role</DropdownMenuItem> : null}
      {canToggle ? <DropdownMenuItem onSelect={() => onAction("toggle", user)}>
        {user.isDisabled ? <><RotateCcw className="size-4" />Unblock user</> : <><Ban className="size-4" />Block user</>}
      </DropdownMenuItem> : null}
    </DropdownMenuContent>
  </DropdownMenu>;
}
