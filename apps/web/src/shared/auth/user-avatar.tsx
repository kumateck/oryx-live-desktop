import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SessionUser } from "./session-api";
import { userInitials } from "./user-display";

/** Shows the user's photo, falling back to initials while it loads or when it cannot be loaded. */
export function UserAvatar({ user, size = "default", className }: {
  user: Pick<SessionUser, "name" | "avatar"> | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const initials = user ? userInitials(user.name) : "";
  return <Avatar size={size} {...(className ? { className } : {})}>
    {user?.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
    <AvatarFallback>{initials || <UserRound aria-hidden="true" className="size-4" />}</AvatarFallback>
  </Avatar>;
}
