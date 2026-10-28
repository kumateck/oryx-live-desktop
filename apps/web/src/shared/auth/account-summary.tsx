import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AvatarForm } from "./avatar-form";
import { DepartmentSwitchDialog } from "./department-switch-dialog";
import { maySwitchDepartment } from "./session-api";
import { useSession } from "./session-provider";
import { UserAvatar } from "./user-avatar";

export function AccountSummary() {
  const { state, refresh, logout } = useSession();
  const [busy, setBusy] = useState<"refresh" | "logout" | null>(null);
  const [switching, setSwitching] = useState(false);
  if (state.status !== "authenticated") return null;
  const { user, permissions } = state.session;

  const run = async (action: "refresh" | "logout") => {
    setBusy(action);
    try {
      if (action === "logout") { await logout(); return; }
      await refresh();
      toast.success("Your access is up to date");
    } catch {
      toast.error("Could not sign out", { description: "Check the connection and retry." });
    } finally {
      setBusy(null);
    }
  };

  return <section className="min-w-0 max-w-2xl space-y-5">
    <div><p className="eyebrow">SETTINGS</p><h1 className="text-xl font-semibold">Account</h1></div>
    <div className="flex min-w-0 items-center gap-4 rounded-lg border bg-card p-4">
      <UserAvatar user={user} size="lg" />
      <div className="min-w-0"><p className="break-words text-base font-semibold">{user.name || "Unnamed user"}</p>
        <p className="break-words text-sm text-muted-foreground">{user.email ?? "No email address"}</p></div>
    </div>
    <dl className="grid gap-x-6 gap-y-3 rounded-lg border bg-card p-4 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
      <dt className="text-muted-foreground">Department</dt><dd className="flex flex-wrap items-center gap-2">{user.department ?? "No department"}
        {maySwitchDepartment(user) ? <Button type="button" size="xs" variant="outline" onClick={() => setSwitching(true)}>Switch department</Button> : null}</dd>
      <dt className="text-muted-foreground">Access</dt>
      <dd>{permissions.length === 1 ? "1 permission" : `${permissions.length} permissions`} from your assigned roles</dd>
      <dt className="text-muted-foreground">Session</dt>
      <dd>Kept securely on this desktop across restarts, until you sign out or your customer server ends the session. Signing out also signs out other open Oryx windows.</dd>
    </dl>
    <AvatarForm userId={user.id} onSaved={refresh} />
    {switching ? <DepartmentSwitchDialog user={user} onClose={() => setSwitching(false)} /> : null}
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => void run("refresh")}>
        {busy === "refresh" ? <><Spinner />Checking…</> : "Refresh my access"}</Button>
      <Button type="button" size="sm" variant="destructive" disabled={busy !== null} onClick={() => void run("logout")}>
        {busy === "logout" ? <><Spinner />Signing out…</> : "Sign out"}</Button>
    </div>
  </section>;
}
