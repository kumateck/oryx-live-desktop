import { useState } from "react";
import { Building2, LogOut, Palette, UserRound } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DepartmentSwitchDialog } from "@/shared/auth/department-switch-dialog";
import { switchDepartmentPermission, type SessionUser } from "@/shared/auth/session-api";
import { useAccess } from "@/shared/auth/use-access";
import { UserAvatar } from "@/shared/auth/user-avatar";
import { useDesktopTab } from "@/shared/workspace-tabs/context";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AccountMenu({ user, onLogout }: { user: SessionUser | null; onLogout: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const desktop = useDesktopTab();
  const { has } = useAccess();
  const logout = async () => {
    setBusy(true);
    try { await onLogout(); }
    catch { toast.error("Could not sign out", { description: "Check the connection and retry." }); setBusy(false); }
  };
  return <><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" size="icon-sm" variant="outline" className="header-avatar"
    aria-label={user ? `Account menu for ${user.name}` : "Account menu"}>
    <UserAvatar user={user} className="size-full rounded-[inherit] after:rounded-[inherit] [&_[data-slot=avatar-fallback]]:rounded-[inherit] [&_[data-slot=avatar-fallback]]:text-xs [&_[data-slot=avatar-image]]:rounded-[inherit]" />
  </Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64">
    <DropdownMenuLabel className="flex min-w-0 items-center gap-3">
      <UserAvatar user={user} />
      <span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{user?.name || "Account"}</span>
        {user ? <span className="account-subtitle wrap-anywhere">{user.roles.join(", ") || "No role assigned"}</span> : null}
        <span className="account-subtitle">{user?.department ?? "No department"}</span></span>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild><Link to="/settings/account"><UserRound className="size-4" />Account</Link></DropdownMenuItem>
    <DropdownMenuItem asChild><Link to="/settings/appearance"><Palette className="size-4" />Appearance</Link></DropdownMenuItem>
    {has(switchDepartmentPermission) ? <DropdownMenuItem onSelect={() => setSwitching(true)}><Building2 className="size-4" />Switch department</DropdownMenuItem> : null}
    <DropdownMenuSeparator />
    <DropdownMenuItem disabled={busy} onSelect={(event) => {
      event.preventDefault();
      if (desktop?.workspace.hasWork()) setConfirmLogout(true); else void logout();
    }}>
      <LogOut className="size-4" />{busy ? "Signing out…" : "Sign out"}
    </DropdownMenuItem>
  </DropdownMenuContent></DropdownMenu>
  {switching && user ? <DepartmentSwitchDialog user={user} onClose={() => setSwitching(false)} /> : null}
  <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}><DialogContent>
    <DialogHeader><DialogTitle>Sign out with unsaved work?</DialogTitle>
      <DialogDescription>Unsaved changes in all open tabs will be lost. Wait for any save in progress before signing out.</DialogDescription></DialogHeader>
    <DialogFooter><Button variant="outline" onClick={() => setConfirmLogout(false)}>Keep working</Button>
      <Button variant="destructive" disabled={busy} onClick={() => {
        if (desktop?.workspace.hasPending()) { toast.error("A save is still in progress. Wait for its result before signing out."); return; }
        void logout();
      }}>Discard changes and sign out</Button></DialogFooter>
  </DialogContent></Dialog></>;
}
