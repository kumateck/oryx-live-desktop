import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionPicker } from "@/modules/roles/components/permission-picker";
import { rolesPath } from "@/modules/roles/lib/permissions";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { Skeleton, SkeletonRegion } from "@/shared/skeleton/skeleton";
import { usePermissionsWorkspace } from "./hooks/use-permissions-workspace";

export function PermissionsPage() {
  const editor = usePermissionsWorkspace();
  const [confirming, setConfirming] = useState(false);
  const [closing, setClosing] = useState(false);
  return <section className="page-fill">
    <UnsavedChangesGuard when={editor.changes > 0} />
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">IT SUPPORT</p><h1 className="text-xl font-semibold">Roles and permissions</h1><p className="text-sm text-muted-foreground">What each role can see and do. Changes apply to everyone who holds the role.</p></div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="max-w-full space-y-1"><label htmlFor="permission-role" className="block text-xs font-medium">Role</label>
          <Select value={editor.role?.value ?? ""} disabled={editor.rolesLoading || editor.saving} onValueChange={(value) => {
            const next = editor.options.find((option) => option.value === value); if (next) editor.chooseRole(next);
          }}><SelectTrigger id="permission-role" className="w-64 max-w-full"><SelectValue placeholder={editor.rolesLoading ? "Loading roles…" : "Select a role"} /></SelectTrigger>
            <SelectContent>{editor.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {editor.mayManageRoles ? <Button asChild size="sm" variant="outline"><Link to={rolesPath}>Manage roles</Link></Button> : null}
      </div>
    </div>
    {editor.rolesError ? <p role="alert" className="text-sm text-destructive">{editor.rolesError} <Button type="button" size="sm" variant="link" onClick={editor.retryRoles}>Retry roles</Button></p> : null}
    {!editor.role ? <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <h2 className="text-sm font-semibold">{!editor.rolesLoading && !editor.rolesError && !editor.options.length ? "No roles available" : "No role selected"}</h2>
      <p className="text-sm text-muted-foreground">Choose a role to see and change what it can do.</p></div>
      : editor.loading ? <SkeletonRegion label="Loading permissions" className="flex-1 space-y-4 rounded-lg border p-4"><Skeleton className="h-16 w-full" />{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</SkeletonRegion>
      : editor.error ? <div role="alert" className="flex-1 space-y-2 rounded-lg border p-4 text-sm"><p>{editor.error}</p><Button type="button" size="sm" variant="outline" onClick={editor.retry}>Retry permissions</Button></div>
      : <PermissionPicker key={editor.role.value} fill modules={editor.permissions} onChange={editor.change} disabled={!editor.mayUpdate || editor.saving} />}
    {editor.role && !editor.loading && !editor.error ? <div className="flex flex-wrap items-center justify-end gap-2">
      <span role="status" className="mr-auto text-sm text-muted-foreground">{editor.changes === 0 ? "No unsaved changes." : `${editor.changes} unsaved ${editor.changes === 1 ? "change" : "changes"}.`}</span>
      {!editor.mayUpdate ? <span className="text-xs text-muted-foreground">View only</span> : null}
      <Button type="button" size="sm" variant="ghost" disabled={editor.saving} onClick={() => { if (editor.changes > 0) setClosing(true); else editor.close(); }}>Cancel</Button>
      {editor.mayReset ? <Button type="button" size="sm" variant="outline" disabled={editor.changes === 0 || editor.saving} onClick={editor.reset}><RotateCcw />Reset changes</Button> : null}
      {editor.mayUpdate ? <Button type="button" size="sm" disabled={editor.changes === 0 || editor.saving} onClick={() => setConfirming(true)}>{editor.saving ? <><Spinner />Saving…</> : "Review and apply"}</Button> : null}
    </div> : null}
    {confirming && editor.role ? <ReviewDialog role={editor.role.label} review={editor.review} onClose={() => setConfirming(false)} onConfirm={editor.save} /> : null}
    {closing ? <Dialog open onOpenChange={(open) => { if (!open) setClosing(false); }}><DialogContent>
      <DialogHeader><DialogTitle>Discard permission changes?</DialogTitle><DialogDescription>Your {editor.changes} unsaved {editor.changes === 1 ? "change" : "changes"} to {editor.role?.label} will be lost.</DialogDescription></DialogHeader>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setClosing(false)}>Keep editing</Button><Button type="button" variant="destructive" onClick={() => { setClosing(false); editor.close(); }}>Discard changes</Button></DialogFooter>
    </DialogContent></Dialog> : null}
    <Dialog open={Boolean(editor.pendingRole)} onOpenChange={(open) => { if (!open) editor.cancelRoleChange(); }}><DialogContent>
      <DialogHeader><DialogTitle>Discard permission changes?</DialogTitle><DialogDescription>Your edits to {editor.role?.label} have not been saved. Switching to {editor.pendingRole?.label} will discard them.</DialogDescription></DialogHeader>
      <DialogFooter><Button type="button" variant="outline" onClick={editor.cancelRoleChange}>Keep editing</Button><Button type="button" variant="destructive" onClick={editor.discardAndChangeRole}>Discard and switch</Button></DialogFooter>
    </DialogContent></Dialog>
  </section>;
}

/** Lists exactly what will be granted and taken away, so a role is never changed blind. A failed save keeps the dialog open with the reason. */
function ReviewDialog({ role, review, onClose, onConfirm }: { role: string; review: { granted: string[]; revoked: string[] }; onClose: () => void; onConfirm: () => Promise<string | null> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async () => { setBusy(true); setError(""); try { const failure = await onConfirm(); if (failure) setError(failure); else onClose(); } catch { setError("The request could not be completed. Try again."); } finally { setBusy(false); } };
  const list = (title: string, items: string[], tone: string) => items.length === 0 ? null : <section aria-label={title} className="space-y-1"><h3 className={`text-sm font-medium ${tone}`}>{title} ({items.length})</h3>
    <ul className="max-h-40 overflow-y-auto rounded-md border text-sm">{items.map((item) => <li key={item} className="border-b px-3 py-1.5 last:border-b-0">{item}</li>)}</ul></section>;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-xl">
    <DialogHeader><DialogTitle>Change what {role} can do?</DialogTitle><DialogDescription>This affects everyone who holds the role, from their next action.</DialogDescription></DialogHeader>
    <DialogBody className="space-y-3">{list("Granted", review.granted, "text-emerald-700 dark:text-emerald-400")}{list("Removed", review.revoked, "text-destructive")}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}</DialogBody>
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Keep editing</Button><Button type="button" disabled={busy} onClick={() => { void run(); }}>{busy ? <><Spinner />Saving…</> : "Apply changes"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
