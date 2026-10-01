import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CreateUserForm } from "../../../../../modules/users/components/create-user-form";
import { useRoleOptions } from "../../../../../modules/users/hooks/use-role-options";
import { usersPath } from "../../../../../modules/users/lib/user-access";

export default function CreateUserPage() {
  const { roles, loading, error, retry } = useRoleOptions();
  return <section className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">ACCESS MANAGEMENT</p><h1 className="text-xl font-semibold">Create user</h1></div>
      <Button asChild variant="outline" size="sm"><Link to={usersPath}>Back to users</Link></Button>
    </div>
    {loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading roles…</p> :
      error ? <div role="alert" className="space-y-2 text-sm"><p>Roles could not be loaded. {error}</p>
        <Button type="button" variant="outline" size="sm" onClick={retry}>Retry</Button></div> :
        <CreateUserForm roles={roles} />}
  </section>;
}
