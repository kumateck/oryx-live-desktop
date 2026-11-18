import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formsApi } from "@/shared/api/generated/forms";
import { addTags } from "@/shared/api/add-tags";
import type { PermissionRequirement } from "@/shared/auth/access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { FormAssignees } from "./assignments";

const schema = z.object({ targets: z.record(z.string(), z.object({ value: z.string().uuid(), label: z.string() })),
  reason: z.string().trim().min(10, "Explain the reassignment in at least 10 characters.").max(1000) });
const api = formsApi.enhanceEndpoints({ endpoints: {
  reassignProductTestFields: definition => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [{ type: "form/assignee" as const, id: "LIST" }]); },
  reassignRawMaterialTestFields: definition => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [{ type: "form/assignee" as const, id: "LIST" }]); },
  reassignPackagingMaterialTestFields: definition => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [{ type: "form/assignee" as const, id: "LIST" }]); },
} });
export function useFieldReassignment(assignees: FormAssignees, require: PermissionRequirement, audit: { module: string; subModule: string }, onDone: () => void) {
  const permission = usePermissionAction(require);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { targets: {}, reason: "" } });
  const targets = useWatch({ control: form.control, name: "targets" });
  const [product] = api.useReassignProductTestFieldsMutation();
  const [raw] = api.useReassignRawMaterialTestFieldsMutation();
  const [packaging] = api.useReassignPackagingMaterialTestFieldsMutation();
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const pending = useRef(false);
  const changed = assignees.assignments.filter(row => targets[row.id] && targets[row.id]?.value !== row.assigneeId);
  const kind = require === "CanReassignProductTest" ? "product" : require === "CanReassignRawMaterialTest" ? "raw" : require === "CanReassignPackagingMaterialTest" ? "packaging" : null;
  const submit = form.handleSubmit(async input => {
    if (pending.current) return;
    const denied = permission.check();
    if (denied) { setProblem(denied); return; }
    if (!kind || !changed.length) { setProblem("Choose at least one question and its new analyst."); return; }
    const fields = changed.flatMap(row => input.targets[row.id] ? [{ assignmentId: row.id, expectedAssigneeId: row.assigneeId, newAssigneeId: input.targets[row.id]?.value ?? "" }] : []);
    pending.current = true; setBusy(true); setProblem(null);
    try {
      const args = { ...audit, assignmentId: assignees.id, appServicesFormsReassignTestFieldsRequest: { fields, reason: input.reason } };
      const result = await (kind === "product" ? product(args) : kind === "raw" ? raw(args) : packaging(args));
      if ("error" in result) { setProblem(apiErrorMessage(result.error)); return; }
      form.reset({ targets: {}, reason: "" }); setSaved(true); onDone();
    } catch (error) { setProblem(error instanceof Error ? error.message : "The reassignment could not be confirmed. Retry or reload the assignments."); }
    finally { pending.current = false; setBusy(false); }
  });
  return { form, targets, changed, submit, problem, busy, saved, allowed: permission.allowed,
    analystPermissions: kind === "product" ? productPermissions : kind === "raw" ? rawPermissions : packagingPermissions };
}
const productPermissions = ["CanStartProductTest"];
const rawPermissions = ["CanStartRawMaterialTest"];
const packagingPermissions = ["CanStartPackagingMaterialTest"];
