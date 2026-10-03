import { useMemo } from "react";
import { Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DomainEntitiesProcurementManufacturersManufacturerDto } from "@/shared/api/generated/procurement";
import { ConfirmDeleteDialog } from "@/shared/actions/confirm-delete-dialog";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { RecordAlerts } from "@/shared/detail/record-alerts";
import { Tabs, useTabParam } from "@/shared/detail/tabs";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { daysUntil, dueState, dueText } from "@/shared/format/due-dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { useDeleteApiV1ProcurementManufacturerByManufacturerIdMutation } from "../api/manufacturer-api";
import { ManufacturerMaterialsTab } from "../detail/manufacturer-materials-tab";
import { approvalLabels, approvalState, manufacturerAlerts, materialCounts } from "../detail/manufacturer-overview";
import { manufacturerAudit, manufacturerPermissions, manufacturersPath } from "../lib/manufacturer-access";

type Tab = "overview" | "materials";
const link = "text-primary underline-offset-2 hover:underline";
const badge = { approved: "default", lapsed: "destructive", pending: "secondary" } as const;

/** One manufacturer on one page: whether it is approved, what needs attention, and what it makes. */
export function ManufacturerDetail({ manufacturer }: { manufacturer: DomainEntitiesProcurementManufacturersManufacturerDto }) {
  const navigate = useNavigate();
  const [remove] = useDeleteApiV1ProcurementManufacturerByManufacturerIdMutation();
  const id = manufacturer.id ?? "";
  const name = manufacturer.name?.trim() || "Manufacturer";
  const materials = useMemo(() => manufacturer.materials ?? [], [manufacturer.materials]);
  const counts = useMemo(() => materialCounts(materials), [materials]);
  const state = approvalState(manufacturer);
  const validity = daysUntil(manufacturer.validityDate);
  const alerts = useMemo(() => manufacturerAlerts(manufacturer, counts.total), [manufacturer, counts.total]);
  const tabs = useMemo(() => [{ id: "overview" as const, label: "Overview" }, { id: "materials" as const, label: `Materials (${counts.total})` }], [counts.total]);
  const [active, select] = useTabParam<Tab>(tabs, "overview");
  const email = manufacturer.email?.trim();
  const creator = `${manufacturer.createdBy?.firstName ?? ""} ${manufacturer.createdBy?.lastName ?? ""}`.trim();

  const deleteManufacturer = async (): Promise<string | null> => {
    const result = await remove({ ...manufacturerAudit, manufacturerId: id });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success("Manufacturer deleted");
    void navigate(manufacturersPath, { replace: true });
    return null;
  };

  return <article className="min-w-0 space-y-4">
    <PageHeader title={name} crumbs={[{ label: "Manufacturers", to: manufacturersPath }, { label: name }]}
      actions={<>
        <PermissionGuard require={manufacturerPermissions.edit}><Button asChild size="sm"><Link to={`${manufacturersPath}/${id}/edit`}><Pencil />Edit</Link></Button></PermissionGuard>
        <PermissionGuard require={manufacturerPermissions.delete}><ConfirmDeleteDialog require={manufacturerPermissions.delete} name={name} onConfirm={deleteManufacturer} /></PermissionGuard>
      </>} />
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Badge variant={badge[state]}>{approvalLabels[state]}</Badge>
      {manufacturer.country?.name ? <span>{manufacturer.country.name}</span> : null}
    </div>
    <RecordAlerts alerts={alerts} onOpenTab={(tab) => { if (tab === "materials") select("materials"); }} />
    <KeyFacts>
      <KeyFact label="Approval" value={approvalLabels[state]} note={manufacturer.approvedAt ? `Approved ${formatDate(manufacturer.approvedAt) ?? ""}` : "Not approved"} state={state === "lapsed" ? "overdue" : "none"} />
      <KeyFact label="Valid until" state={manufacturer.approvedAt ? dueState(validity) : "none"} value={formatDate(manufacturer.validityDate) ?? "Not set"}
        note={validity === null ? "No renewal date recorded" : validity < 0 ? dueText(validity).replace(" overdue", " ago") : dueText(validity)} />
      <KeyFact label="Materials made" value={counts.total} note={counts.total ? `${counts.raw} raw · ${counts.packaging} packaging` : "None recorded"} />
    </KeyFacts>

    <Tabs label="Manufacturer records" tabs={tabs} active={active} onSelect={select}>
      {active === "overview" ? <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <DetailGroup title="Company">
          <DetailItem label="Name" value={manufacturer.name} />
          <DetailItem label="Country" value={manufacturer.country?.name} />
          <DetailItem label="Email" value={email ? <a className={link} href={`mailto:${email}`}>{email}</a> : null} />
          <DetailItem label="Address" value={manufacturer.address?.trim() ? <span className="whitespace-pre-line">{manufacturer.address.trim()}</span> : null} />
        </DetailGroup>
        <div className="min-w-0 space-y-4">
          <DetailGroup title="Approval">
            <DetailItem label="Status" value={approvalLabels[state]} />
            <DetailItem label="Approved on" value={formatDate(manufacturer.approvedAt)} />
            <DetailItem label="Valid until" value={manufacturer.validityDate ? `${formatDate(manufacturer.validityDate) ?? ""}${validity !== null ? ` (${validity < 0 ? dueText(validity).replace(" overdue", " ago") : dueText(validity)})` : ""}` : null} />
          </DetailGroup>
          <DetailGroup title="Record">
            <DetailItem label="Created" value={formatDateTime(manufacturer.createdAt)} />
            <DetailItem label="Created by" value={creator || null} />
          </DetailGroup>
        </div>
      </div> : <ManufacturerMaterialsTab materials={materials} />}
    </Tabs>
  </article>;
}
