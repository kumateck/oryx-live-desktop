import { lazy, Suspense, useMemo } from "react";
import { Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery, type DomainEntitiesProcurementSuppliersSupplierDto } from "@/shared/api/generated/procurement";
import { ConfirmDeleteDialog } from "@/shared/actions/confirm-delete-dialog";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useAccess } from "@/shared/auth/use-access";
import { RecordAlerts } from "@/shared/detail/record-alerts";
import { Tabs, useTabParam } from "@/shared/detail/tabs";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useDeleteApiV1ProcurementSupplierBySupplierIdMutation } from "../api/supplier-api";
import { SupplierKeyFacts } from "../detail/supplier-key-facts";
import { SupplierMaterialsTab } from "../detail/supplier-materials-tab";
import { certificateSummary, supplierAlerts, supplierTabs, type SupplierTab } from "../detail/supplier-overview";
import { SupplierOverviewTab } from "../detail/supplier-overview-tab";
import { supplierAudit, supplierPermissions, supplierStatus, supplierType, suppliersPath } from "../lib/supplier-access";
import { useGetCertificationsQuery, useGetPerformanceQuery } from "../relationship/relationship-api";
import { SupplierStatusDialog } from "./supplier-status-dialog";

const CertificationsPanel = lazy(() => import("../relationship/certifications-panel"));
const ContactsPanel = lazy(() => import("../relationship/contacts-panel"));
const BankingPanel = lazy(() => import("../relationship/banking-panel"));
const PricingPanel = lazy(() => import("../relationship/pricing-panel"));
const PerformancePanel = lazy(() => import("../relationship/performance-panel"));

const statusVariant = (status: 0 | 1 | 2 | undefined) => status === 2 ? "destructive" as const : status === 1 ? "default" as const : "secondary" as const;

/** One supplier on one page: where it stands, what needs attention, and every record kept about it. */
export function SupplierDetail({ supplier }: { supplier: DomainEntitiesProcurementSuppliersSupplierDto }) {
  const navigate = useNavigate();
  const access = useAccess();
  const [remove] = useDeleteApiV1ProcurementSupplierBySupplierIdMutation();
  const id = supplier.id ?? "";
  const name = supplier.name?.trim() || "Supplier";
  const mayCertificates = access.has("CanViewSupplierCertifications");
  const mayPerformance = access.has("CanViewSupplierPerformance");

  const links = useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery({ ...supplierAudit, supplierId: id }, { skip: !id });
  const certificatesQuery = useGetCertificationsQuery(id, { skip: !id || !mayCertificates });
  const performanceQuery = useGetPerformanceQuery(id, { skip: !id || !mayPerformance });

  // The supplier record carries its links too; the dedicated request adds purchase units and refreshes them.
  const supplies = useMemo(() => links.data ?? supplier.associatedManufacturers ?? [], [links.data, supplier.associatedManufacturers]);
  const materials = useMemo(() => links.isLoading && !supplier.associatedManufacturers ? null : {
    count: new Set(supplies.map((item) => item.material?.id ?? item.material?.name)).size,
    manufacturers: new Set(supplies.flatMap((item) => item.manufacturer?.id ?? item.manufacturer?.name ?? [])).size,
  }, [links.isLoading, supplier.associatedManufacturers, supplies]);
  const certificates = useMemo(() => certificatesQuery.data ? certificateSummary(certificatesQuery.data) : null, [certificatesQuery.data]);
  const score = useMemo(() => {
    const latest = [...(performanceQuery.data ?? [])].sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
    return latest ? { value: latest.score, period: `${formatDate(latest.periodStart) ?? ""} to ${formatDate(latest.periodEnd) ?? ""}` } : null;
  }, [performanceQuery.data]);

  const tabs = useMemo(() => supplierTabs(access.has, materials?.count ?? null), [access.has, materials]);
  const [active, select] = useTabParam<SupplierTab>(tabs, "overview");
  const alerts = useMemo(() => supplierAlerts({ status: supplier.status, requalificationDueDate: supplier.requalificationDueDate, certificates, materials: materials?.count ?? null }),
    [supplier.status, supplier.requalificationDueDate, certificates, materials]);

  const deleteSupplier = async (): Promise<string | null> => {
    const result = await remove({ ...supplierAudit, supplierId: id });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success("Supplier deleted");
    void navigate(suppliersPath, { replace: true });
    return null;
  };

  return <article className="min-w-0 space-y-4">
    <PageHeader title={name} crumbs={[{ label: "Suppliers", to: suppliersPath }, { label: name }]}
      actions={<>
        <PermissionGuard require={supplierPermissions.edit}><Button asChild size="sm"><Link to={`${suppliersPath}/${id}/edit`}><Pencil />Edit</Link></Button></PermissionGuard>
        <PermissionGuard require={supplierPermissions.edit}><SupplierStatusDialog id={id} current={supplier.status} /></PermissionGuard>
        <PermissionGuard require={supplierPermissions.delete}><ConfirmDeleteDialog require={supplierPermissions.delete} name={name} onConfirm={deleteSupplier} /></PermissionGuard>
      </>} />
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Badge variant={statusVariant(supplier.status)}>{supplierStatus(supplier.status)}</Badge>
      <Badge variant="outline">{supplierType(supplier.type)} supplier</Badge>
      {supplier.country?.name ? <span>{supplier.country.name}</span> : null}
      {supplier.currency?.name ? <span>· trades in {supplier.currency.name}</span> : null}
    </div>
    <RecordAlerts alerts={alerts} onOpenTab={(tab) => { const target = tabs.find((item) => item.id === tab); if (target) select(target.id); }} />
    <SupplierKeyFacts statusLabel={supplierStatus(supplier.status)} approvedAt={supplier.approvedAt} requalificationDueDate={supplier.requalificationDueDate} materials={materials}
      {...(mayCertificates ? { certificates } : {})} {...(mayPerformance ? { score, scoreLoading: performanceQuery.isLoading } : {})} />
    {!access.has(supplierPermissions.edit) && supplier.status === 0 ? <p className="text-xs text-muted-foreground">A user with supplier edit access can approve or reject this supplier.</p> : null}

    <Tabs label="Supplier records" tabs={tabs} active={active} onSelect={select}>
      <Suspense fallback={<Skeleton className="h-44 w-full" />}>
        {active === "overview" ? <SupplierOverviewTab supplier={supplier} /> : null}
        {active === "materials" ? <SupplierMaterialsTab supplies={supplies} loading={links.isLoading && supplies.length === 0}
          error={links.error && supplies.length === 0 ? apiErrorMessage(links.error) : null} onRetry={() => { void links.refetch(); }} /> : null}
        {active === "certifications" ? <CertificationsPanel supplierId={id} /> : null}
        {active === "contacts" ? <ContactsPanel supplierId={id} /> : null}
        {active === "banking" ? <BankingPanel supplierId={id} /> : null}
        {active === "pricing" ? <PricingPanel supplierId={id} /> : null}
        {active === "performance" ? <PerformancePanel supplierId={id} showPerformance={mayPerformance} showSpend={access.has("CanViewSupplierSpend")} /> : null}
      </Suspense>
    </Tabs>
  </article>;
}
