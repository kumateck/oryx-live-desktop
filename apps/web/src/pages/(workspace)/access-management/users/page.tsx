import { useCallback, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { UserDialogs, type OpenUserAction } from "../../../../modules/users/components/user-dialogs";
import type { UserAction } from "../../../../modules/users/components/user-row-actions";
import { UserStatusTabs } from "../../../../modules/users/components/user-status-tabs";
import { UsersTable } from "../../../../modules/users/components/users-table";
import { useUsersList } from "../../../../modules/users/hooks/use-users-list";
import { userPermissions, usersPath } from "../../../../modules/users/lib/user-access";
import type { UserRow } from "../../../../modules/users/schemas/user-schema";

export default function UsersPage() {
  const list = useUsersList();
  const [open, setOpen] = useState<OpenUserAction | null>(null);
  const onAction = useCallback((action: UserAction, user: UserRow) => setOpen({ action, user }), []);
  if (!list.status) return null;
  return <section className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">ACCESS MANAGEMENT</p><h1 className="text-xl font-semibold">Users</h1></div>
      <div className="flex flex-wrap items-center gap-2">
        <UserStatusTabs statuses={list.statuses} status={list.status} onChange={list.setStatus} />
        <PermissionGuard require={userPermissions.create}><Button asChild size="sm"><Link to={`${usersPath}/create`}>Create user</Link></Button></PermissionGuard>
      </div>
    </div>
    <UsersTable rows={list.rows} access={list.access} onAction={onAction} search={list.search}
      paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      inactive={list.status === "inactive"} />
    <UserDialogs open={open} onClose={() => setOpen(null)} />
  </section>;
}
