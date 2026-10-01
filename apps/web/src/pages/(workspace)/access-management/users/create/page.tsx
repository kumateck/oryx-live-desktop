import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { CreateUserForm } from "../../../../../modules/users/components/create-user-form";
import { useRoleOptions } from "../../../../../modules/users/hooks/use-role-options";

export default function CreateUserPage() {
  const { roles, loading, error, retry } = useRoleOptions();
  return <section className="min-w-0 space-y-5">
    <PageHeader title="Create user" crumbs={[{ label: "Create" }]} />
    {loading ? <div className="max-w-xl"><FormPageSkeleton label="Loading roles" sections={[2]} columns="grid-cols-1" /></div> :
      error ? <div role="alert" className="space-y-2 text-sm"><p>Roles could not be loaded. {error}</p>
        <Button type="button" variant="outline" size="sm" onClick={retry}>Retry</Button></div> :
        <CreateUserForm roles={roles} />}
  </section>;
}
