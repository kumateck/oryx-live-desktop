import { skipToken } from "@reduxjs/toolkit/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { formsApi } from "@/shared/api/generated/forms";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { invalidateTemplate, templatesApi } from "../api/templates-api";
import { createRequest, editPlan, emptySection, type FormType, type LoadedTemplate, type TemplateSection, type TemplateWrite } from "../lib/template-model";
import { readTemplate } from "../lib/template-schema";
import { editTemplatePath, templatePermissions, templatesAudit, templatesPath, templateTypes } from "../lib/templates";

export const templateFormSchema = z.object({ name: z.string().trim().min(1, "Enter the template name."), type: z.custom<SelectOption>().nullable().refine((value): boolean => value !== null, "Choose what the template is for.") });
export type TemplateFormValues = z.infer<typeof templateFormSchema>;
const typeOf = (option: SelectOption | null): FormType => option?.value === "1" ? 1 : 0;

/** Loads a template (or the one being copied), keeps its tests while they are edited, and saves the difference write by write. */
export function useTemplateEditor(templateId: string | null, copyFrom: string | null) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const source = templateId ?? copyFrom;
  const query = templatesApi.useGetApiV1FormByFormIdQuery(source ? { ...templatesAudit, formId: source } : skipToken);
  const [create, creating] = templatesApi.usePostApiV1FormMutation();
  const [metadata] = formsApi.usePutApiV1FormByFormIdMetadataMutation();
  const [createSection] = formsApi.usePostApiV1FormByFormIdSectionMutation();
  const [updateSection] = formsApi.usePutApiV1FormSectionBySectionIdMutation();
  const [deleteSection] = formsApi.useDeleteApiV1FormSectionBySectionIdMutation();
  const [createField] = formsApi.usePostApiV1FormSectionBySectionIdFieldMutation();
  const [updateField] = formsApi.usePutApiV1FormFieldByFieldIdMutation();
  const [deleteField] = formsApi.useDeleteApiV1FormFieldByFieldIdMutation();
  const permission = usePermissionAction(templateId ? templatePermissions.edit : templatePermissions.create);
  const form = useForm<TemplateFormValues>({ resolver: zodResolver(templateFormSchema), defaultValues: { name: "", type: templateTypes[0] } });
  const [sections, setSections] = useState<TemplateSection[]>(() => [emptySection()]);
  const loaded = useRef<LoadedTemplate | null>(null);
  const [ready, setReady] = useState(!source);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!source || !query.data || ready) return;
    const read = readTemplate(query.data, Boolean(templateId));
    if (!read) return;
    loaded.current = read.loaded;
    form.reset({ name: templateId ? read.loaded.name : "", type: templateTypes[read.loaded.type] });
    setSections(read.sections.length ? read.sections : [emptySection()]);
    setReady(true);
  }, [form, query.data, ready, source, templateId]);

  const write = async (step: TemplateWrite, formId: string) => {
    const audit = templatesAudit;
    switch (step.kind) {
      case "metadata": return metadata({ ...audit, formId, domainEntitiesFormsRequestUpdateFormMetadataRequest: step.body });
      case "delete-section": return deleteSection({ ...audit, sectionId: step.sectionId });
      case "create-section": return createSection({ ...audit, formId, domainEntitiesFormsRequestCreateFormSectionRequest: step.body });
      case "update-section": return updateSection({ ...audit, sectionId: step.sectionId, domainEntitiesFormsRequestUpdateFormSectionRequest: step.body });
      case "delete-field": return deleteField({ ...audit, fieldId: step.fieldId });
      case "create-field": return createField({ ...audit, sectionId: step.sectionId, domainEntitiesFormsRequestCreateFormFieldRequest: step.body });
      case "update-field": return updateField({ ...audit, fieldId: step.fieldId, domainEntitiesFormsRequestUpdateFormFieldRequest: step.body });
    }
  };

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (sections.some((section) => !section.name.replace(/<[^>]*>/g, "").trim())) { setMessage("Give every test a name."); return; }
    setSaving(true);
    try {
      if (!templateId) {
        const result = await create({ ...templatesAudit, domainEntitiesFormsRequestCreateFormRequest: createRequest(values.name, typeOf(values.type), sections) });
        if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
        toast.success("Template created");
        void navigate(templatesPath);
        return;
      }
      const original = loaded.current;
      if (!original) { setMessage("The template has not loaded yet."); return; }
      const plan = editPlan(original, values.name, typeOf(values.type), sections);
      for (const [index, step] of plan.entries()) {
        const again = permission.check();
        if (again) { setMessage(again); return; }
        const result = await write(step, templateId);
        if ("error" in result) {
          // Earlier steps are saved. Reload so the page matches the server before anything else is tried.
          setMessage(`${String(index)} of ${String(plan.length)} changes were saved before this failed: ${apiErrorMessage(result.error)} The template has been reloaded.`);
          setReady(false);
          dispatch(invalidateTemplate(templateId));
          return;
        }
      }
      dispatch(invalidateTemplate(templateId));
      toast.success(plan.length ? "Template saved" : "No changes to save");
      void navigate(templatesPath);
    } finally { setSaving(false); }
  });

  return {
    form, sections, setSections, ready, saving: saving || creating.isLoading, message, submit, copying: !templateId && Boolean(copyFrom),
    loading: Boolean(source) && (query.isLoading || !ready && !query.error), error: query.error ? apiErrorMessage(query.error) : source && query.data && !readTemplate(query.data, true) ? "The server returned a template the app could not read." : null,
    retry: () => void query.refetch(), cancel: () => void navigate(templatesPath), editPath: editTemplatePath,
  };
}
