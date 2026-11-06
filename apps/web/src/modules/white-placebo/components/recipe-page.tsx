import { toast } from "sonner";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useSaveWhitePlaceboRecipeMutation } from "../api/white-placebo-api";
import { useWorkspace } from "../hooks/use-workspace";
import { audit, path, permissions } from "../lib/white-placebo";
import { RecipeForm } from "./recipe-form";
import { apiErrorMessage, LoadState } from "./load-state";

export function WhitePlaceboRecipePage() {
  const workspace = useWorkspace();
  const [save, mutation] = useSaveWhitePlaceboRecipeMutation();
  const permission = usePermissionAction(permissions.recipe);
  if (!workspace.data) return <LoadState loading={workspace.loading} message={workspace.error} retry={workspace.retry} />;
  const data = workspace.data;
  return <article className="min-w-0 space-y-4"><PageHeader title="White Placebo recipe" crumbs={[{ label: "White Placebo", to: path }, { label: "Recipe" }]} />
    <p className="text-sm text-muted-foreground">Enter the site's approved excipient recipe. Saving records the reference and creates the next recipe revision; it does not approve a pharmaceutical formula.</p>
    {workspace.error ? <p role="alert" className="text-destructive">{workspace.error} Your edits are kept; reload the page only after saving or copying them.</p> : null}
    <RecipeForm workspace={data} saving={mutation.isLoading} save={async (values, revision) => {
      const denied = permission.check();
      if (denied) return denied;
      if (!values.material) return "Choose the White Placebo material.";
      const result = await save({ ...audit, domainEntitiesMaterialsWhitePlaceboSaveWhitePlaceboRecipe: {
        materialId: values.material.value, revision, reference: values.reference,
        expectedQuantity: values.expectedQuantity, instructions: values.instructions, storageConditions: values.storageConditions,
        holdHours: values.holdHours, ingredients: values.ingredients,
      } });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success("White Placebo recipe saved");
      return null;
    }} />
  </article>;
}
