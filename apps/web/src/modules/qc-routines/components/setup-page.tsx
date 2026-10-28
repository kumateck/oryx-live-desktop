import { useMemo, useState, type ReactNode } from "react";
import { BadgeCheck, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { formsApi } from "@/shared/api/generated/forms";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import type { PermissionRequirement } from "@/shared/auth/access";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { useApproveSpecification, VerifiableRecord } from "@/shared/specifications/use-approve-specification";
import { routinesApi, routinesChanged } from "../api/routines-api";
import { analysisLabel, cadenceLabel, routinePermissions, routinesPath, setupAudit, typeLabel, type Definition, type Requirement, type RoutineArd } from "../lib/routines";
import { MicrobialArdDialog, microbialArdPermission, RequirementDialog, RoutineArdDialog, ScheduleDialog } from "./setup-dialogs";

function Panel({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return <section aria-label={title} className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>{action}</div>{children}</section>;
}
const verified = (yes: boolean) => yes ? <Badge><BadgeCheck />Verified</Badge> : <Badge variant="outline">Awaiting verification</Badge>;
const add = (require: PermissionRequirement, label: string, onClick: () => void) => <PermissionGuard require={require}><Button size="sm" variant="outline" onClick={onClick}><Plus />{label}</Button></PermissionGuard>;

type Open = "schedule" | "ard" | "requirement" | "microbial" | { verify: "ard"; row: RoutineArd } | { verify: "requirement"; row: Requirement } | null;
const definitionColumn = dataTableColumns<Definition>();
const definitionColumns = definitionColumn.columns([
  definitionColumn.accessor((row) => row.name ?? "", { id: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.name ?? "–"}</span> }),
  definitionColumn.accessor((row) => typeLabel(row.type), { id: "type", header: "Type" }),
  definitionColumn.accessor((row) => cadenceLabel(row.cadence), { id: "cadence", header: "Frequency" }),
  definitionColumn.accessor("isActive", { header: "Status", cell: ({ row }) => <Badge variant={row.original.isActive ? "default" : "outline"}>{row.original.isActive ? "Active" : "Inactive"}</Badge> }),
]);

/** Routine schedules, routine ARD profiles, microbial applicability, and the microbial ARDs of materials and products. */
export function RoutineSetupPage() {
  const definitions = routinesApi.useListDefinitionsQuery(undefined);
  const ards = routinesApi.useListRoutineArdsQuery(undefined);
  const requirements = routinesApi.useListRequirementsQuery(undefined);
  const forms = formsApi.useGetApiV1FormQuery({ ...setupAudit, page: 1, pageSize: 500 });
  const formName = useMemo(() => new Map((forms.data?.data ?? []).flatMap((form) => form.id ? [[form.id, form.name ?? "Unnamed template"] as const] : [])), [forms.data]);
  const approveArd = useApproveSpecification(VerifiableRecord.RoutineArd, routinesChanged, setupAudit);
  const approveRequirement = useApproveSpecification(VerifiableRecord.MicrobialRequirement, routinesChanged, setupAudit);
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);

  const ardColumns = useMemo(() => { const column = dataTableColumns<RoutineArd>(); return column.columns([
    column.accessor((row) => `${typeLabel(row.type)} · ${analysisLabel(row.analysisType)}`, { id: "routine", header: "Routine", cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> }),
    column.accessor((row) => formName.get(row.formId) ?? "", { id: "form", header: "Worksheet", cell: ({ row }) => formName.get(row.original.formId) ?? "Template" }),
    column.accessor((row) => row.specNumber ?? "", { id: "spec", header: "Specification", cell: ({ row }) => row.original.specNumber ?? "–" }),
    column.accessor((row) => row.coaItems.filter((item) => item.includeOnCoa).length, { id: "items", header: "Certificate rows", size: 130 }),
    column.accessor("isVerified", { header: "Status", cell: ({ row }) => verified(row.original.isVerified) }),
    column.display({ id: "verify", size: 120, cell: ({ row }) => row.original.isVerified ? null : <PermissionGuard require={routinePermissions.setupManage}>
      <Button size="sm" variant="outline" onClick={() => setOpen({ verify: "ard", row: row.original })}>Verify</Button></PermissionGuard> }),
  ]); }, [formName]);
  const requirementColumns = useMemo(() => { const column = dataTableColumns<Requirement>(); return column.columns([
    column.accessor((row) => row.subjectName ?? "", { id: "subject", header: "Applies to", cell: ({ row }) => <span><span className="font-medium">{row.original.subjectName ?? "Unnamed"}</span>
      <span className="block text-xs text-muted-foreground">{row.original.subject === 1 ? "Finished product" : "Material"}</span></span> }),
    column.accessor("required", { header: "Microbial analysis", cell: ({ row }) => row.original.required ? "Required" : "Not required" }),
    column.accessor((row) => row.reason ?? "", { id: "reason", header: "Reason", cell: ({ row }) => <span className="line-clamp-2 break-words">{row.original.reason ?? "–"}</span> }),
    column.accessor("isVerified", { header: "Status", cell: ({ row }) => verified(row.original.isVerified) }),
    column.display({ id: "verify", size: 120, cell: ({ row }) => row.original.isVerified ? null : <PermissionGuard require={routinePermissions.microbial}>
      <Button size="sm" variant="outline" onClick={() => setOpen({ verify: "requirement", row: row.original })}>Verify</Button></PermissionGuard> }),
  ]); }, []);

  return <article className="min-w-0 space-y-4">
    <PageHeader title="Routine setup" crumbs={[{ label: "Routine tests", to: routinesPath }, { label: "Setup" }]} />
    <Panel title="Schedules" description="Monthly or quarterly routines that scheduled runs are made from." action={add(routinePermissions.setupManage, "New schedule", () => setOpen("schedule"))}>
      <ListDataTable label="Schedules" columns={definitionColumns} rows={definitions.data ?? []} getRowId={(row) => row.id} loading={definitions.isLoading} onRetry={() => void definitions.refetch()}
        error={definitions.error ? apiErrorMessage(definitions.error) : null} emptyTitle="No schedules" emptyDescription="Create the monthly or quarterly routines." />
    </Panel>
    <Panel title="Routine ARD profiles" description="The worksheet each routine analysis is tested on, and the fields its certificate reports." action={add(routinePermissions.setupManage, "New ARD profile", () => setOpen("ard"))}>
      <ListDataTable label="Routine ARD profiles" columns={ardColumns} rows={ards.data ?? []} getRowId={(row) => row.id} loading={ards.isLoading} onRetry={() => void ards.refetch()}
        error={ards.error ? apiErrorMessage(ards.error) : null} emptyTitle="No routine ARDs" emptyDescription="Samples can be added once each analysis has a verified ARD." />
    </Panel>
    <Panel title="Microbial applicability" description="Which materials and finished products need microbial analysis, with the controlled reason." action={add(routinePermissions.microbial, "Record applicability", () => setOpen("requirement"))}>
      <ListDataTable label="Microbial applicability" columns={requirementColumns} rows={requirements.data ?? []} getRowId={(row) => row.id} loading={requirements.isLoading} onRetry={() => void requirements.refetch()}
        error={requirements.error ? apiErrorMessage(requirements.error) : null} emptyTitle="Nothing recorded" emptyDescription="Record the materials and products whose microbial need is decided." />
    </Panel>
    <Panel title="Commercial microbial ARD" description="The separate microbial worksheet of a material or finished product, and its rows on the combined certificate."
      action={add(microbialArdPermission, "New microbial ARD", () => setOpen("microbial"))}><p className="text-sm text-muted-foreground">Created records appear with the material and product analytical raw data, awaiting verification.</p></Panel>
    {open === "schedule" ? <ScheduleDialog onClose={close} /> : null}
    {open === "ard" ? <RoutineArdDialog onClose={close} /> : null}
    {open === "requirement" ? <RequirementDialog onClose={close} /> : null}
    {open === "microbial" ? <MicrobialArdDialog onClose={close} /> : null}
    {open && typeof open === "object" ? <ConfirmActionDialog require={open.verify === "ard" ? routinePermissions.setupManage : routinePermissions.microbial} destructive={false}
      title={open.verify === "ard" ? `Verify the ${typeLabel(open.row.type).toLowerCase()} ${analysisLabel(open.row.analysisType).toLowerCase()} ARD?` : `Verify the applicability for ${open.row.subjectName ?? "this item"}?`}
      description={open.verify === "ard" ? "Once verified, new samples of this routine are tested on it." : "Once verified, the microbial decision applies to new tests."} confirmLabel="Verify" busyLabel="Verifying…" onClose={close}
      onConfirm={async () => { const error = await (open.verify === "ard" ? approveArd : approveRequirement).approve(open.row.id); if (!error) close(); return error; }} /> : null}
  </article>;
}
