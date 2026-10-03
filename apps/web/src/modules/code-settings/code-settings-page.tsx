import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SettingsFormDialog, SettingsHeader } from "@/modules/settings-support/ui";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePageSearch } from "@/shared/search/page-search";
import { codeApi, codeAudit, codeDefaults, codeFormSchema, codePermissions, codeRowsSchema, exampleCode, freeModelTypes, namingTypeLabel, namingTypeOptions, spaced, type CodeFormValues, type CodeRule } from "./code-settings";

function CodeDialog({ rule, rules, onClose }: { rule: CodeRule | null; rules: readonly CodeRule[]; onClose: () => void }) {
  const [create, creating] = codeApi.usePostApiV1ConfigurationMutation();
  const [update, updating] = codeApi.usePutApiV1ConfigurationByConfigurationIdMutation();
  const [message, setMessage] = useState("");
  const form = useForm<CodeFormValues>({ resolver: zodResolver(codeFormSchema), defaultValues: codeDefaults(rule) });
  const fields: WizardField<CodeFormValues>[] = [
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "modelType", label: "Code for", required: true, placeholder: "Select what is coded", options: freeModelTypes(rules, rule) },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "namingType", label: "Numbering", required: true, placeholder: "Select numbering", options: [...namingTypeOptions] },
    { type: InputTypes.TEXT, name: "prefix", label: "Prefix", required: true, className: "md:col-span-2" },
    { type: InputTypes.NUMBER, name: "minimum", label: "Minimum code length", required: true, min: 1, max: 7, step: 1, description: "Between 1 and 7. Shorter numbers are padded with zeros." },
    { type: InputTypes.NUMBER, name: "maximum", label: "Maximum code length", required: true, min: 3, max: 15, step: 1, description: "Between 3 and 15." },
  ];
  return <SettingsFormDialog title={rule ? `Edit the ${spaced(rule.modelType)} code` : "Add a code rule"} description="How the codes of a kind of record are made. Existing codes do not change." form={form} fields={fields} saving={creating.isLoading || updating.isLoading} message={message}
    submitLabel={rule ? "Save rule" : "Add rule"} onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const namingType = ([0, 1, 2] as const).find((value) => String(value) === values.namingType?.value);
      if (namingType === undefined || !values.modelType) return;
      const body = { modelType: values.modelType.value, prefix: values.prefix, namingType, minimumNameLength: values.minimum, maximumNameLength: values.maximum };
      const result = rule ? await update({ ...codeAudit, configurationId: rule.id, domainEntitiesConfigurationsCreateConfigurationRequest: body }) : await create({ ...codeAudit, domainEntitiesConfigurationsCreateConfigurationRequest: body });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success(rule ? "Code rule updated" : "Code rule added"); onClose();
    }} />;
}

const column = dataTableColumns<CodeRule>();
export function CodeSettingsPage() {
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("code settings", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = codeApi.useGetApiV1ConfigurationQuery({ ...codeAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  // Every rule, to know which record types already have one.
  const all = codeApi.useGetApiV1ConfigurationQuery({ ...codeAudit, page: 1, pageSize: 500 });
  const [remove] = codeApi.useDeleteApiV1ConfigurationByConfigurationIdMutation();
  const parsed = useMemo(() => query.data ? codeRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const everyRule = useMemo(() => { const result = codeRowsSchema.safeParse(all.data?.data ?? []); return result.success ? result.data : []; }, [all.data]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [editing, setEditing] = useState<CodeRule | "new" | null>(null);
  const [removing, setRemoving] = useState<CodeRule | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor((row) => spaced(row.modelType), { id: "modelType", header: "Code for", cell: ({ row }) => <span className="font-medium">{spaced(row.original.modelType)}</span> }),
    column.accessor((row) => namingTypeLabel(row.namingType), { id: "namingType", header: "Numbering", size: 130 }),
    column.accessor("prefix", { header: "Prefix", size: 130 }),
    column.accessor("minimum", { header: "Min length", size: 110 }),
    column.accessor("maximum", { header: "Max length", size: 110 }),
    column.accessor((row) => exampleCode(row), { id: "example", header: "Example", size: 190, cell: ({ row }) => <code className="whitespace-nowrap text-xs">{exampleCode(row.original)}</code> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${spaced(row.original.modelType)}`} items={[
      { id: "edit", label: "Edit code", icon: Pencil, require: codePermissions.edit, onSelect: () => setEditing(row.original) },
      { id: "remove", label: "Delete code", icon: Trash2, require: codePermissions.remove, destructive: true, separated: true, onSelect: () => setRemoving(row.original) }]} /> }),
  ]), []);
  return <section className="page-fill">
    <SettingsHeader title="Code settings" description="How the codes of products, orders, batches and other records are made.">
      <PermissionGuard require={codePermissions.add}><Button type="button" size="sm" onClick={() => setEditing("new")}><Plus />Add code rule</Button></PermissionGuard>
    </SettingsHeader>
    <ServerDataTable label="Code settings" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned code rules the app could not read." : null} onRetry={() => { void query.refetch(); }}
      emptyTitle={search.trim() ? "No code rules match this search" : "No code rules"} emptyDescription={search.trim() ? "Search by what is coded or by prefix." : "Add the first code rule."} />
    {editing ? <CodeDialog key={editing === "new" ? "new" : editing.id} rule={editing === "new" ? null : editing} rules={everyRule} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={codePermissions.remove} title={`Delete the ${spaced(removing.modelType)} code rule?`} description="New records of this kind will no longer be given a suggested code. Existing codes do not change." confirmLabel="Delete rule" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...codeAudit, configurationId: removing.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success("Code rule deleted"); return null; }} /> : null}
  </section>;
}
