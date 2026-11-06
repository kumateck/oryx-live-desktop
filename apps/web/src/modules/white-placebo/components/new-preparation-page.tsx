import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { PageHeader } from "@/shared/navigation/page-header";
import { useCreateWhitePlaceboPreparationMutation } from "../api/white-placebo-api";
import { useWorkspace } from "../hooks/use-workspace";
import { audit, path, permissions } from "../lib/white-placebo";
import { PreparationForm } from "./preparation-form";
import { apiErrorMessage, LoadState } from "./load-state";

export function NewWhitePlaceboPreparationPage() {
  const workspace = useWorkspace();
  const [create, mutation] = useCreateWhitePlaceboPreparationMutation();
  const [savedId, setSavedId] = useState<string | null>(null);
  const permission = usePermissionAction(permissions.create);
  const navigate = useNavigate();
  if (!workspace.data) return <LoadState loading={workspace.loading} message={workspace.error} retry={workspace.retry} />;
  const recipe = workspace.data.recipe;
  return <article className="min-w-0 space-y-4"><PageHeader title="Prepare White Placebo" crumbs={[{ label: "White Placebo", to: path }, { label: "New preparation" }]} />
    {savedId ? <section className="space-y-3"><h2 className="font-semibold">Preparation requested</h2><p>The ingredient request follows your existing raw-stock approval process.</p>
      <Button onClick={() => navigate(`${path}/${savedId}`)}>Open preparation</Button></section>
      : recipe ? <PreparationForm recipe={recipe} stock={workspace.data.stock} saving={mutation.isLoading} save={async (values, id, revision) => {
        const denied = permission.check();
        if (denied) return denied;
        const result = await create({ ...audit, domainEntitiesMaterialsWhitePlaceboCreateWhitePlaceboPreparation: { ...values, id, recipeRevision: revision } });
        if ("error" in result) return apiErrorMessage(result.error);
        setSavedId(id);
        return null;
      }} /> : <section className="space-y-3"><p>Set up the approved White Placebo recipe before requesting ingredients.</p>
        <PermissionGuard require={permissions.recipe}><Button asChild><Link to={`${path}/recipe`}>Set up recipe</Link></Button></PermissionGuard></section>}
  </article>;
}
