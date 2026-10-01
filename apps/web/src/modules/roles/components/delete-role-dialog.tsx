import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useDeleteApiV1RoleByIdMutation, useLazyGetApiV1RoleCheckByIdQuery } from "../api/role-api";
import { audit, rolesPath } from "../lib/permissions";

export function DeleteRoleDialog({ id, name }: { id: string; name: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [checkRole, check] = useLazyGetApiV1RoleCheckByIdQuery();
  const [removeRole, removal] = useDeleteApiV1RoleByIdMutation();
  const remove = async () => {
    setMessage("");
    const usage = await checkRole({ ...audit, id }, false);
    if (usage.error) { setMessage(apiErrorMessage(usage.error)); return; }
    if (usage.data?.hasUsers) { setMessage("This role is assigned to users. Reassign them before deleting it."); return; }
    const result = await removeRole({ ...audit, id });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    setOpen(false);
    toast.success(`${name} was deleted`);
    void navigate(rolesPath, { replace: true });
  };
  return <Dialog open={open} onOpenChange={(value) => { setOpen(value); setMessage(""); }}>
    <DialogTrigger asChild><Button type="button" variant="destructive" size="sm">Delete role</Button></DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>Delete {name}?</DialogTitle>
      <DialogDescription>Users assigned to this role must be reassigned first. This action cannot be undone.</DialogDescription>
    </DialogHeader>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="button" variant="destructive" disabled={check.isFetching || removal.isLoading} onClick={() => void remove()}>
          {check.isFetching || removal.isLoading ? <><Spinner />Checking…</> : "Delete role"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
