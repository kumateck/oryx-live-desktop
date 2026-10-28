import { useParams, useSearchParams } from "react-router";
import { useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useTemplateEditor, type TemplateFormValues } from "../hooks/use-template-editor";
import { templatePermissions, templatesPath, templateTypes } from "../lib/templates";
import { SectionsEditor } from "./sections-editor";

const fields: WizardField<TemplateFormValues>[] = [
  { type: InputTypes.TEXT, name: "name", label: "Template name", required: true, placeholder: "e.g. Paracetamol tablets ARD" },
  { type: InputTypes.SELECT, mode: "single", source: "sync", name: "type", label: "Used for", required: true, options: templateTypes, description: "Analytical raw data sheets are filled in when a batch is tested; specification templates hold the limits." },
];

function TemplateEditor({ templateId, copyFrom }: { templateId: string | null; copyFrom: string | null }) {
  const editor = useTemplateEditor(templateId, copyFrom);
  const type = useWatch({ control: editor.form.control, name: "type" });
  // Reading the errors here subscribes this component to them; a host that watches values must, or its fields show no messages.
  void editor.form.formState.errors;
  if (editor.loading) return <FormPageSkeleton label="Loading template" />;
  if (editor.error) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Template unavailable</h1><p className="text-sm text-muted-foreground">{editor.error}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={editor.retry}>Retry</Button><Button size="sm" onClick={editor.cancel}>Templates</Button></div></div>;
  const title = templateId ? "Edit template" : editor.copying ? "Copy template" : "New template";
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={[{ label: "Templates", to: templatesPath }, { label: title }]} actions={<PermissionGuard require={templateId ? templatePermissions.edit : templatePermissions.create}>
      <Button type="button" variant="outline" onClick={editor.cancel}>Cancel</Button>
      <Button type="submit" form="template-editor" disabled={editor.saving}>{editor.saving ? <><Spinner />Saving…</> : templateId ? "Save template" : "Create template"}</Button></PermissionGuard>} />
    <form id="template-editor" noValidate onSubmit={(event) => void editor.submit(event)} className="space-y-4">
      <div className="rounded-lg border bg-card p-4"><FormWizard form={editor.form} fields={fields} className="md:grid-cols-2" /></div>
      {editor.message ? <p role="alert" className="text-sm text-destructive">{editor.message}</p> : null}
      <SectionsEditor sections={editor.sections} setSections={editor.setSections} formType={type?.value === "1" ? 1 : 0} />
    </form>
  </article>;
}

export function TemplateEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const copyFrom = id ? null : params.get("copyFrom");
  return <TemplateEditor key={`${id ?? "new"}:${copyFrom ?? ""}`} templateId={id ?? null} copyFrom={copyFrom} />;
}
