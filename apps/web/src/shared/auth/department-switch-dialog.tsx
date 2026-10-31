import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/shared/api/base-api";
import { identityApi } from "@/shared/api/generated/identity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { switchDepartmentPermission, type SessionUser } from "./session-api";
import { useSession } from "./session-provider";
import { usePermissionAction } from "./use-permission-action";

const audit = { module: "User Management", subModule: "Switch Department" };
// The server publishes this without a response type, so the generated client leaves it out (docs/api-untyped-operations.md).
const switchApi = api.injectEndpoints({ endpoints: (build) => ({
  switchDepartment: build.mutation<unknown, string>({ query: (departmentId) => ({ url: `/api/v1/user/switch-department/${departmentId}`, method: "POST", headers: { Module: audit.module, SubModule: audit.subModule } }) }),
}) });
const productionType = 0;

/**
 * Moves the signed-in user to another production department. The server saves this on the account, so it
 * holds in every window until it is switched back; everything read for the old department is read again.
 */
export function DepartmentSwitchDialog({ user, onClose }: { user: SessionUser; onClose: () => void }) {
  const dispatch = useDispatch();
  const { refresh } = useSession();
  const permission = usePermissionAction(switchDepartmentPermission);
  const departments = identityApi.useGetApiV1DepartmentQuery({ ...audit, page: 1, pageSize: 200, type: productionType });
  const [switchTo] = switchApi.useSwitchDepartmentMutation();
  const [chosen, setChosen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const options = useMemo(() => (departments.data?.data ?? []).flatMap((department) => department.id && department.id !== user.departmentId
    ? [{ id: department.id, name: department.name?.trim() || "Unnamed department" }] : []).sort((a, b) => a.name.localeCompare(b.name)), [departments.data, user.departmentId]);
  const target = options.find((option) => option.id === chosen) ?? null;
  const submit = async () => {
    if (!target || busy) return;
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setBusy(true); setError("");
    const result = await switchTo(target.id);
    if ("error" in result) {
      setBusy(false);
      const refused = Boolean(result.error && "status" in result.error && result.error.status === 403);
      setError(refused ? "You do not have permission to switch department. Ask an administrator for Can Switch Department." : apiErrorMessage(result.error));
      // The server's refusal means the access shown here is out of date.
      if (refused) await refresh();
      return;
    }
    // Lists, queues and stock were read for the old department.
    dispatch(api.util.resetApiState());
    await refresh();
    toast.success("Department changed", { description: `You are now working in ${target.name}.` });
    onClose();
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Switch department</DialogTitle>
        <DialogDescription>Move your account to another production department. The change is saved on your account: it applies in every window, and stays until you switch back.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="min-w-0"><dt className="eyebrow">Current role</dt><dd className="break-words font-medium">{user.roles.join(", ") || "No role assigned"}</dd></div>
          <div className="min-w-0"><dt className="eyebrow">Current department</dt><dd className="break-words font-medium">{user.department ?? "No department"}</dd></div>
        </dl>
        <div className="space-y-2">
        <label htmlFor="switch-department" className="text-sm font-medium">Production department</label>
        <Select value={chosen} onValueChange={(value) => { setChosen(value); setError(""); }} disabled={busy || departments.isLoading}>
          <SelectTrigger id="switch-department" className="w-full"><SelectValue placeholder={departments.isLoading ? "Loading departments…" : options.length ? "Choose a department" : "No other production department"} /></SelectTrigger>
          <SelectContent>{options.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectContent>
        </Select>
        {departments.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(departments.error)}</p> : null}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={!target || busy} onClick={() => void submit()}>{busy ? <><Spinner />Switching…</> : target ? `Switch to ${target.name}` : "Switch"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
