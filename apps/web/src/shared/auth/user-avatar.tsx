import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SessionUser } from "./session-api";
import { userInitials } from "./user-display";
import { useAvatarVersion } from "./avatar-version";

/** Shows the user's photo, falling back to initials while it loads or when it cannot be loaded. */
export function UserAvatar({ user, size = "default", className }: {
  user: Pick<SessionUser, "name" | "avatar"> | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const initials = user ? userInitials(user.name) : "";
  const version = useAvatarVersion();
  return <Avatar size={size} {...(className ? { className } : {})}>
    {user?.avatar ? <AvatarImage src={version ? `${user.avatar}?v=${version}` : user.avatar} alt="" /> : null}
    <AvatarFallback>{initials || <UserRound aria-hidden="true" className="size-4" />}</AvatarFallback>
  </Avatar>;
}
