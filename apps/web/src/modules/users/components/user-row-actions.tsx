import { Ban, Eye, RotateCcw, UserCog } from "lucide-react";
import { TableMenu } from "@/shared/actions";
import type { UserAccess } from "../hooks/use-user-access";
import type { UserRow } from "../schemas/user-schema";

export type UserAction = "details" | "role" | "toggle";

export function UserRowActions({ user, access, onAction }: {
  user: UserRow;
  access: UserAccess;
  onAction: (action: UserAction, user: UserRow) => void;
}) {
  const canToggle = user.isDisabled ? access.unblock : access.block;
  return <TableMenu label={`Actions for ${user.name}`} items={[
    { id: "details", label: "User details", icon: Eye, onSelect: () => onAction("details", user) },
    access.edit && { id: "role", label: "Change role", icon: UserCog, onSelect: () => onAction("role", user) },
    canToggle && (user.isDisabled
      ? { id: "toggle", label: "Unblock user", icon: RotateCcw, separated: true, onSelect: () => onAction("toggle", user) }
      : { id: "toggle", label: "Block user", icon: Ban, destructive: true, separated: true, onSelect: () => onAction("toggle", user) }),
  ]} />;
}
