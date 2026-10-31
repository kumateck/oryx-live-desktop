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
const productionType = 0;
interface DepartmentOption { value: string; departmentId: string | null; name: string }
const noDepartment: DepartmentOption = { value: "no-department", departmentId: null, name: "No department" };

/**
 * Sets or removes the signed-in user's department. The server saves this on the account;
 * everything read for the previous department is discarded after a successful change.
 */
export function DepartmentSwitchDialog({ user, onClose }: { user: SessionUser; onClose: () => void }) {
  const dispatch = useDispatch();
  const { refresh } = useSession();
  const permission = usePermissionAction(switchDepartmentPermission);
  const departments = identityApi.useGetApiV1DepartmentQuery({ ...audit, page: 1, pageSize: 200, type: productionType });
  const [switchTo] = identityApi.usePostApiV1UserSwitchDepartmentMutation();
  const [chosen, setChosen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const options = useMemo<DepartmentOption[]>(() => {
    const assigned = (departments.data?.data ?? []).flatMap((department) => department.id && department.id !== user.departmentId
      ? [{ value: department.id, departmentId: department.id, name: department.name?.trim() || "Unnamed department" }] : [])
      .sort((a, b) => a.name.localeCompare(b.name));
    return user.departmentId ? [noDepartment, ...assigned] : assigned;
  }, [departments.data, user.departmentId]);
  const target = options.find((option) => option.value === chosen) ?? null;
  const submit = async () => {
    if (!target || busy) return;
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setBusy(true); setError("");
    const result = await switchTo({ ...audit, domainEntitiesUsersRequestSwitchDepartmentRequest: { departmentId: target.departmentId } });
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
    toast.success(target.departmentId === null ? "Department removed" : "Department changed", {
      description: target.departmentId === null ? "Your account is no longer assigned to a department." : `You are now working in ${target.name}.`,
    });
    onClose();
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Switch department</DialogTitle>
        <DialogDescription>Choose a production department, or select No department to remove your assignment. The change is saved on your account and applies across your open windows.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="min-w-0"><dt className="eyebrow">Current role</dt><dd className="break-words font-medium">{user.roles.join(", ") || "No role assigned"}</dd></div>
          <div className="min-w-0"><dt className="eyebrow">Current department</dt><dd className="break-words font-medium">{user.department ?? "No department"}</dd></div>
        </dl>
        <div className="space-y-2">
        <label htmlFor="switch-department" className="text-sm font-medium">Department</label>
        <Select value={chosen} onValueChange={(value) => { setChosen(value); setError(""); }} disabled={busy || (departments.isLoading && options.length === 0)}>
          <SelectTrigger id="switch-department" className="w-full" aria-invalid={Boolean(error)} aria-describedby={error ? "switch-department-error" : undefined}>
            <SelectValue placeholder={departments.isLoading ? "Loading departments…" : options.length ? "Choose a department" : "No other production department"} />
          </SelectTrigger>
          <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.name}</SelectItem>)}</SelectContent>
        </Select>
        {departments.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(departments.error)}</p> : null}
        {error ? <p id="switch-department-error" role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={!target || busy} onClick={() => void submit()}>{busy ? <><Spinner />Saving…</> : target?.departmentId === null ? "Remove department" : target ? `Switch to ${target.name}` : "Switch"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
