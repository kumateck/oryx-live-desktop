import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton, SkeletonRegion } from "@/shared/skeleton/skeleton";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { usePutApiV1UserRoleByIdMutation } from "../api/user-api";
import { useRoleOptions } from "../hooks/use-role-options";
import { audit, userPermissions } from "../lib/user-access";
import type { UserRow } from "../schemas/user-schema";

export function ChangeRoleDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const { roles, loading, error, retry } = useRoleOptions();
  const [roleName, setRoleName] = useState(user.role?.name ?? "");
  const [message, setMessage] = useState("");
  const permission = usePermissionAction(userPermissions.edit);
  const [updateRole, mutation] = usePutApiV1UserRoleByIdMutation();
  const unchanged = roleName === (user.role?.name ?? "");

  const save = async () => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const result = await updateRole({ ...audit, id: user.id, domainEntitiesRolesUpdateUserRoleRequest: { roleNames: [roleName] } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`${user.name}'s role was changed`);
    onClose();
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isLoading) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>Change role</DialogTitle>
        <DialogDescription>{user.name}{user.email ? ` · ${user.email}` : ""}. A user has one role; it decides what they can see and do.</DialogDescription></DialogHeader>
      {loading ? <SkeletonRegion label="Loading roles"><Skeleton className="h-9 w-full" /></SkeletonRegion> :
        error ? <div role="alert" className="space-y-2 text-sm"><p>Roles could not be loaded. {error}</p>
          <Button type="button" size="sm" variant="outline" onClick={retry}>Retry</Button></div> :
          <Select value={roleName} onValueChange={setRoleName} disabled={mutation.isLoading}>
            <SelectTrigger aria-label="Role" className="w-full"><SelectValue placeholder="Select a role" /></SelectTrigger>
            <SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.name}>{role.label}</SelectItem>)}</SelectContent>
          </Select>}
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={mutation.isLoading} onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={!permission.allowed || mutation.isLoading || unchanged || !roleName || Boolean(error)} onClick={() => void save()}>
          {mutation.isLoading ? <><Spinner />Saving…</> : "Save role"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
