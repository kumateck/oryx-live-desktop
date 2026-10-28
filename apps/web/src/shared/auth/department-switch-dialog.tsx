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
import type { SessionUser } from "./session-api";
import { useSession } from "./session-provider";

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
    setBusy(true); setError("");
    const result = await switchTo(target.id);
    if ("error" in result) {
      setBusy(false);
      setError(result.error && "status" in result.error && result.error.status === 403 ? "Your role does not allow moving to another department." : apiErrorMessage(result.error));
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
        <DialogDescription>You now work in {user.department ?? "no department"}. The change is saved on your account: it applies in every window, and stays until you switch back.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-2">
        <label htmlFor="switch-department" className="text-sm font-medium">Production department</label>
        <Select value={chosen} onValueChange={(value) => { setChosen(value); setError(""); }} disabled={busy || departments.isLoading}>
          <SelectTrigger id="switch-department" className="w-full"><SelectValue placeholder={departments.isLoading ? "Loading departments…" : options.length ? "Choose a department" : "No other production department"} /></SelectTrigger>
          <SelectContent>{options.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectContent>
        </Select>
        {departments.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(departments.error)}</p> : null}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={!target || busy} onClick={() => void submit()}>{busy ? <><Spinner />Switching…</> : target ? `Switch to ${target.name}` : "Switch"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
