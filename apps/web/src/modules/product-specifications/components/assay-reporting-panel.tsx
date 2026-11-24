import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { assayReportingApi } from "../api/assay-reporting-api";
import { assayConfigurationSchema, assayReportingKeys, assayRows, type AssayOutputRow } from "../lib/assay-reporting";
import { audit } from "../lib/product-specifications";
import { testStageLabel } from "@/shared/specifications/specification-rules";
import { AssayReportingEditor } from "./assay-reporting-editor";

const column = dataTableColumns<AssayOutputRow>();
export default function AssayReportingPanel({ specificationId, onClose }: { specificationId: string; onClose: () => void }) {
  const access = useAccess();
  const query = assayReportingApi.useGetProductAssayReportingQuery({ ...audit, id: specificationId });
  const parsed = useMemo(() => query.currentData ? assayConfigurationSchema.safeParse(query.currentData) : null, [query.currentData]);
  const configuration = parsed?.success ? parsed.data : null;
  const rows = useMemo(() => configuration ? assayRows(configuration) : [], [configuration]);
  const [editing, setEditing] = useState<AssayOutputRow | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor("test", { header: "Test", cell: ({ row }) => <RichTextView html={row.original.test} /> }),
    column.accessor("label", { header: "Output", cell: ({ row }) => <div className="space-y-1"><RichTextView html={row.original.label} />
      {row.original.unavailable ? <p className="text-xs text-destructive">{row.original.unavailable}</p> : null}</div> }),
    column.accessor(row => row.rule ? "% w/v" : "Original basis", { id: "basis", header: "COA basis" }),
    column.accessor(row => row.rule?.nominalConcentration ?? null, { id: "nominal", header: "Nominal % w/v", cell: ({ row }) => row.original.rule?.nominalConcentration ?? "–" }),
    column.accessor(row => row.rule ? `${row.rule.minimum}–${row.rule.maximum}% w/v` : "–", { id: "limits", header: "COA limits" }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Reporting for ${row.original.label}`} items={[
      { id: "edit", label: "Edit reporting", icon: Pencil, require: assayReportingKeys.edit,
        disabled: Boolean(row.original.unavailable && !row.original.rule), onSelect: () => setEditing(row.original) },
    ]} /> }),
  ]), []);
  if (editing && configuration && access.has(assayReportingKeys.edit)) return <AssayReportingEditor key={editing.key} configuration={configuration} row={editing} onClose={() => setEditing(null)} onSaved={() => {
      setEditing(null); toast.success("Reporting settings saved. Approve the product specification before generating a COA.");
    }} />;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-5xl">
    <DialogHeader><DialogTitle>COA assay reporting</DialogTitle><DialogDescription>{configuration
      ? `${configuration.productName} · ${configuration.specificationNumber} · ${testStageLabel(configuration.testStage)}`
      : "Product-specific reporting settings"}</DialogDescription></DialogHeader>
    <DialogBody className="space-y-3"><p className="text-sm text-muted-foreground">Select the assay output used on this product’s test worksheet. Each output has its own reporting settings for this product.</p>
      <ClientDataTable label="Assay reporting outputs" columns={columns} rows={rows} getRowId={row => row.key}
        loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
        error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The reporting settings could not be read." : null}
        emptyTitle="No assay outputs" emptyDescription="The product’s test worksheet needs a formula output before reporting can be configured." />
    </DialogBody><DialogFooter><Button type="button" variant="outline" onClick={onClose}>Close</Button></DialogFooter>
  </DialogContent></Dialog>;
}
