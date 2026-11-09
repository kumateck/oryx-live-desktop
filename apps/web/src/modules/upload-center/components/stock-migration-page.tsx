import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmActionDialog } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { migrationAudit, stockMigrationApi, type MigrationDto } from "../api/stock-migration-api";
import { approvalBlocker, comparisonChange, isDraft, massUnits, openingBalancePermissions, migrationStatusLabels, shelfOptions, volumeUnits } from "../lib/stock-migration";
import { uploadCenterPath } from "../lib/upload-center";
import { StockMigrationComparison } from "./stock-migration-comparison";
import { StockMigrationLines } from "./stock-migration-lines";
import { MigrationMaterialLinks } from "./migration-material-links";

type Confirm = "approve" | "discard" | null;

function Units({ migration }: { migration: MigrationDto }) {
  const [update, { isLoading }] = stockMigrationApi.useUpdateUnitsMutation();
  const permission = usePermissionAction(openingBalancePermissions.correct);
  const draft = isDraft(migration);
  const change = async (massUnit: string, volumeUnit: string) => {
    const denied = permission.check();
    if (denied) { toast.error(denied); return; }
    const result = await update({ ...migrationAudit, id: migration.id ?? "", domainEntitiesMaterialsStockMigrationsUpdateStockMigrationUnitsRequest: { massUnit, volumeUnit } });
    if ("error" in result) toast.error(apiErrorMessage(result.error));
  };
  const unit = (label: string, value: string, units: readonly string[], onChange: (next: string) => void) =>
    <label className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange} disabled={!draft || isLoading || !permission.allowed}><SelectTrigger aria-label={label} className="w-20"><SelectValue /></SelectTrigger>
        <SelectContent>{units.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>;
  return <div className="flex flex-wrap items-center gap-4">
    {unit("Weights in the sheet are in", migration.massUnit ?? "kg", massUnits, (next) => void change(next, migration.volumeUnit ?? "L"))}
    {unit("Liquids in", migration.volumeUnit ?? "L", volumeUnits, (next) => void change(migration.massUnit ?? "kg", next))}
    {isLoading ? <Spinner /> : null}
  </div>;
}

/** Checks an uploaded stock count row by row before it replaces the department's storage stock. */
export interface MigrationHome { path: string; label: string }
const uploadCenterHome: MigrationHome = { path: uploadCenterPath, label: "Back to Upload Center" };

export function StockMigrationPage({ home = uploadCenterHome }: { home?: MigrationHome } = {}) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const query = stockMigrationApi.useMigrationQuery({ ...migrationAudit, id }, { skip: !id });
  const comparison = stockMigrationApi.useComparisonQuery({ ...migrationAudit, id }, { skip: !id });
  const [recheck, recheckState] = stockMigrationApi.useRecheckMutation();
  const correctionPermission = usePermissionAction(openingBalancePermissions.correct);
  const approvalPermission = usePermissionAction(openingBalancePermissions.approve);
  const checkAgain = async () => {
    const denied = correctionPermission.check();
    if (denied) { toast.error(denied); return; }
    const result = await recheck({ ...migrationAudit, id });
    if ("error" in result) toast.error(apiErrorMessage(result.error));
  };
  const [approve] = stockMigrationApi.useApproveMutation();
  const [discard] = stockMigrationApi.useDiscardMutation();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const shelves = useMemo(() => shelfOptions(query.data?.warehouses), [query.data?.warehouses]);
  const back = <Button asChild variant="ghost" size="sm"><Link to={home.path}><ArrowLeft />{home.label}</Link></Button>;

  if (query.isLoading) return <DetailPageSkeleton label="Loading the stock migration" />;
  const migration = query.data;
  if (query.error || !migration) return <div role="alert" className="space-y-3">{back}<p>{query.error ? apiErrorMessage(query.error) : "This stock migration could not be found."}</p></div>;

  const topUp = migration.mode === 1;
  const title = topUp ? "Migration stock top-up" : "Opening balances";
  const approveLabel = topUp ? "Approve stock top-up" : "Approve opening balances";
  const draft = isDraft(migration);
  const blocker = approvalBlocker(migration);
  const wiped = (migration.warehouses ?? []).filter((store) => store.willBeWiped).map((store) => store.name).join(" and ");
  const removed = (comparison.data ?? []).filter((row) => comparisonChange(row) === "removed").length;
  const loading = (migration.ok ?? 0) + (migration.warning ?? 0);

  return <article className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">{back}<h1 className="break-words text-xl font-semibold">{title} <Badge variant={draft ? "secondary" : "default"}>{migrationStatusLabels[migration.status ?? 0]}</Badge></h1>
        <p className="break-words text-sm">{migration.departmentName} · {migration.fileName ?? "Stock sheet"}</p>
        <p className="text-sm text-muted-foreground">Uploaded {formatDateTime(migration.createdAt)} by {migration.createdBy}
          {migration.approvedAt ? ` · approved ${formatDateTime(migration.approvedAt)} by ${migration.approvedBy ?? ""}` : ""}</p></div>
      {draft ? <div className="flex flex-wrap gap-2">
        <MigrationMaterialLinks migration={migration} />
        <PermissionGuard require={openingBalancePermissions.correct}>
        <Button type="button" size="sm" variant="outline" disabled={recheckState.isLoading} onClick={() => void checkAgain()}>
          {recheckState.isLoading ? <Spinner /> : <RefreshCw />}Check again</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setConfirm("discard")}><Trash2 />Discard</Button>
        </PermissionGuard>
        <PermissionGuard require={openingBalancePermissions.approve}><Button type="button" size="sm" disabled={blocker !== null} title={blocker ?? undefined} onClick={() => setConfirm("approve")}><CheckCircle2 />{approveLabel}</Button></PermissionGuard>
      </div> : null}
    </div>
    <div className="space-y-2 rounded-md border p-3 text-sm">
      <Units migration={migration} />
      {topUp ? <p className="whitespace-pre-wrap break-words"><strong>Reason:</strong> {migration.reason}</p> : null}
      {topUp ? <p>{draft ? `This draft does not affect available stock. Approval adds ${loading} checked row(s) and preserves existing stock. A row whose batch is already in stock with the same AR number, manufacturing and expiry dates is added to that batch; any other row becomes a separate lot.` : `${loading} row(s) were added to stock. Rows matching an existing batch were added to it; the rest became separate lots. Existing stock was preserved.`}{blocker ? <span className="text-destructive"> {blocker}</span> : null}</p> : draft ? <p>This draft does not affect available stock. Approval establishes opening balances from {loading} ready and checked rows in <strong>{wiped || "no store"}</strong>.
        {blocker ? <span className="text-destructive"> {blocker}</span> : null}</p>
        : <p>{migration.writtenOff ?? 0} shelf record(s) were written off and {loading} row(s) loaded.</p>}
      <p className="text-xs text-muted-foreground">Use &quot;Check again&quot; after adding a missing shelf or material in settings.</p>
    </div>
    <Tabs defaultValue="rows"><TabsList><TabsTrigger value="rows">Rows</TabsTrigger><TabsTrigger value="compare">Stock before and after</TabsTrigger></TabsList>
      <TabsContent value="rows" className="pt-3"><StockMigrationLines migration={migration} shelves={shelves} /></TabsContent>
      <TabsContent value="compare" className="pt-3"><StockMigrationComparison migrationId={id} topUp={topUp} approved={migration.status === 1} /></TabsContent></Tabs>
    {confirm === "approve" ? <ConfirmActionDialog title={topUp ? "Approve this migration stock top-up?" : "Approve these opening balances?"} require={openingBalancePermissions.approve} confirmLabel={approveLabel} busyLabel="Approving stock…"
      description={topUp ? `Add ${loading} checked row(s) as new stock lots. Existing balances are preserved. Reason: ${migration.reason ?? ""}. Approval cannot be undone from here.` : `All current stock in ${wiped} is written off${removed ? `, including ${removed} material(s) that are not in the sheet,` : ""} and ${loading} row(s) are loaded as new batches. This cannot be undone from here.`}
      onConfirm={async () => { const denied = approvalPermission.check(); if (denied) return denied; const result = await approve({ ...migrationAudit, id }); if ("error" in result) return apiErrorMessage(result.error); toast.success(topUp ? "Migration stock top-up approved" : "Opening balances approved"); return null; }}
      onClose={() => setConfirm(null)} /> : null}
    {confirm === "discard" ? <ConfirmActionDialog title="Discard this draft?" require={openingBalancePermissions.correct} confirmLabel="Discard" busyLabel="Discarding…"
      description="The checked rows are kept for reference but nothing is loaded. The stock is not changed."
      onConfirm={async () => { const denied = correctionPermission.check(); if (denied) return denied; const result = await discard({ ...migrationAudit, id }); if ("error" in result) return apiErrorMessage(result.error); void navigate(home.path); return null; }}
      onClose={() => setConfirm(null)} /> : null}
  </article>;
}
