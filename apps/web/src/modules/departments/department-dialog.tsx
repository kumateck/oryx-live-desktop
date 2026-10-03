import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { settingsApi } from "@/shared/api/generated/settings";
import { generateCode } from "@/shared/codes/generate-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { codePrefix, departmentApi, departmentAudit, departmentFormSchema, departmentRowsSchema, departmentTypes, parentChoices, type Department, type DepartmentFormValues } from "./departments";

const codeAudit = { module: "Settings", subModule: "Code Settings" } as const;

/**
 * Suggests a code while a new department is being named, until the code is edited by hand. It is a
 * suggestion only: the server decides whether the code is accepted.
 */
function useSuggestedCode(enabled: boolean, name: string, apply: (code: string) => void) {
  const rule = settingsApi.useGetApiV1ConfigurationByModelTypeByModelTypeQuery({ ...codeAudit, modelType: "Department" }, { skip: !enabled });
  const [count] = settingsApi.useLazyGetApiV1ConfigurationByModelTypeCountQuery();
  useEffect(() => {
    const data = rule.data;
    if (!enabled || !data || data.namingType === undefined || !name.trim()) return;
    let current = true;
    const prefix = codePrefix(data.prefix, name);
    // Waits for typing to pause, so a count is not requested for every letter.
    const timer = setTimeout(() => { void count({ ...codeAudit, modelType: "Department", prefix }).unwrap().catch(() => 0).then((used) => {
      if (current) apply(generateCode({ prefix, namingType: data.namingType ?? 0, minimumLength: data.minimumNameLength ?? 0, maximumLength: data.maximumNameLength ?? 0 }, used)); }); }, 300);
    return () => { current = false; clearTimeout(timer); };
  }, [enabled, rule.data, name, count, apply]);
}

/** Adds a department or changes one. The code of an existing department cannot be changed. */
export function DepartmentDialog({ department, onClose }: { department: Department | null; onClose: () => void }) {
  const [create, creating] = departmentApi.usePostApiV1DepartmentMutation();
  const [update, updating] = departmentApi.usePutApiV1DepartmentByDepartmentIdMutation();
  const all = departmentApi.useGetApiV1DepartmentQuery({ ...departmentAudit, page: 1, pageSize: 1000 });
  const [message, setMessage] = useState("");
  const form = useForm<DepartmentFormValues>({ resolver: zodResolver(departmentFormSchema), defaultValues: department
    ? { code: department.code, name: department.name, type: String(department.type), parent: department.parent, description: department.description ?? "" } : { code: "", name: "", type: "", parent: null, description: "" } });
  const name = useWatch({ control: form.control, name: "name" });
  const apply = useMemo(() => (code: string) => { if (code && !form.getFieldState("code").isDirty) form.setValue("code", code, { shouldValidate: true }); }, [form]);
  useSuggestedCode(department === null, name, apply);
  const parents = useMemo(() => { const parsed = departmentRowsSchema.safeParse(all.data?.data ?? []); return parentChoices(parsed.success ? parsed.data : [], department?.id ?? null); }, [all.data, department]);
  const fields: WizardField<DepartmentFormValues>[] = [
    { type: InputTypes.TEXT, name: "name", label: "Name", required: true },
    { type: InputTypes.TEXT, name: "code", label: "Department code", required: true, readOnly: department !== null, description: department ? "The code of a department cannot be changed." : "Suggested from the name. You can change it." },
    { type: InputTypes.RADIO, name: "type", label: "Type", required: true, options: [...departmentTypes] },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "parent", label: "Parent department", placeholder: all.isLoading ? "Loading departments…" : "No parent", options: parents },
    { type: InputTypes.RICHTEXT, name: "description", label: "Description", className: "md:col-span-2" },
  ];
  return <SettingsFormDialog title={department ? `Edit ${department.name}` : "Add a department"} description="Departments group staff, stock and requests." form={form} fields={fields} saving={creating.isLoading || updating.isLoading} message={message}
    submitLabel={department ? "Save department" : "Add department"} onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const type = ([0, 1] as const).find((value) => String(value) === values.type);
      if (type === undefined) return;
      const body = { code: values.code, name: values.name, description: values.description ?? "", type, parentDepartmentId: values.parent?.value ?? null,
        ...(department && department.division !== null ? { division: department.division } : {}) };
      const result = department ? await update({ ...departmentAudit, departmentId: department.id, domainEntitiesDepartmentsRequestCreateDepartmentRequest: body }) : await create({ ...departmentAudit, domainEntitiesDepartmentsRequestCreateDepartmentRequest: body });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success(department ? "Department updated" : "Department added"); onClose();
    }} />;
}
