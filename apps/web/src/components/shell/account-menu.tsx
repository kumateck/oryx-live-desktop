import { useState } from "react";
import { LogOut, Palette, UserRound } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { SessionUser } from "@/shared/auth/session-api";
import { UserAvatar } from "@/shared/auth/user-avatar";

export function AccountMenu({ user, onLogout }: { user: SessionUser | null; onLogout: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true);
    try { await onLogout(); }
    catch { toast.error("Could not sign out", { description: "Check the connection and retry." }); setBusy(false); }
  };
  return <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" size="icon-sm" variant="outline" className="header-avatar"
    aria-label={user ? `Account menu for ${user.name}` : "Account menu"}>
    <UserAvatar user={user} className="size-full rounded-[inherit] after:rounded-[inherit] [&_[data-slot=avatar-fallback]]:rounded-[inherit] [&_[data-slot=avatar-fallback]]:text-xs [&_[data-slot=avatar-image]]:rounded-[inherit]" />
  </Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64">
    <DropdownMenuLabel className="flex min-w-0 items-center gap-3">
      <UserAvatar user={user} />
      <span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{user?.name || "Account"}</span>
        {user?.email ? <span className="account-subtitle truncate">{user.email}</span> : null}
        <span className="account-subtitle">{user?.department ?? "No department"}</span></span>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild><Link to="/settings/account"><UserRound className="size-4" />Account</Link></DropdownMenuItem>
    <DropdownMenuItem asChild><Link to="/settings/appearance"><Palette className="size-4" />Appearance</Link></DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem disabled={busy} onSelect={(event) => { event.preventDefault(); void logout(); }}>
      <LogOut className="size-4" />{busy ? "Signing out…" : "Sign out"}
    </DropdownMenuItem>
  </DropdownMenuContent></DropdownMenu>;
}
