import { useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { batchNumber } from "@/modules/stock-issue/lib/stock-issue";
import { materialsApi } from "@/shared/api/generated/materials";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { monthRangeDays, type MonthRange } from "@/shared/date-pickers/date-utils";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMonthYear } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { apiDay, daysToExpiry, expiryRowsSchema, monthOf, type ExpiryBatch } from "../expiry";

const { useGetApiV1MaterialBatchesExpiredQuery, useGetApiV1MaterialBatchesAboutToExpireQuery } = materialsApi;
const show = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
const kinds = [{ value: 0 as const }, { value: 1 as const }];
interface Filter { range: MonthRange | null }
const fields: WizardField<Filter>[] = [{ type: InputTypes.MONTH_RANGE, name: "range", label: "Expiring from month to month" }];
const column = dataTableColumns<ExpiryBatch>();
const columns = column.columns([
  column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
  column.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", size: 170, cell: ({ row }) => <div><div>{batchNumber(row.original.batchNumber)}</div><div className="text-xs text-muted-foreground">AR {row.original.arNumber ?? "not recorded"}</div></div> }),
  column.accessor((row) => row.made ?? "", { id: "made", header: "Manufactured", size: 150, cell: ({ row }) => formatMonthYear(row.original.made) ?? "–" }),
  column.accessor((row) => row.expires ?? "", { id: "expires", header: "Expiry", size: 180, cell: ({ row }) => { const days = daysToExpiry(row.original.expires);
    return <div><div>{formatMonthYear(row.original.expires) ?? "–"}</div>{days === null ? null : <div className={`text-xs ${days <= 0 ? "font-medium text-destructive" : "text-muted-foreground"}`}>{days < 0 ? `${-days} ${days === -1 ? "day" : "days"} ago` : days === 0 ? "Today" : `In ${days} ${days === 1 ? "day" : "days"}`}</div>}</div>; } }),
  column.display({ id: "shelves", header: "Shelves", cell: ({ row }) => row.original.shelves.length ? <span className="break-words">{row.original.shelves.join(", ")}</span> : <span className="text-muted-foreground">Not on a shelf</span> }),
  column.accessor("remaining", { header: "Remaining", size: 160, cell: ({ row }) => <div><div className="font-medium">{show(row.original.remaining, row.original.unit)}</div><div className="text-xs text-muted-foreground">of {show(row.original.total, row.original.unit)}</div></div> }),
]);

/** Batches whose expiry date falls in a period: already expired, or coming up. Raw and packaging are listed apart. */
export function ExpiryReportPage({ mode }: { mode: "expired" | "soon" }) {
  const navigate = useNavigate();
  const title = mode === "expired" ? "Expired materials" : "About to expire materials";
  const audit = { module: "Warehouse", subModule: mode === "expired" ? "Expired Materials" : "About To Expire Materials" };
  const [kind, setKind] = useState<MaterialKind>(0);
  const [initial] = useState(() => monthOf());
  const form = useForm<Filter>({ defaultValues: { range: initial } });
  const range = useWatch({ control: form.control, name: "range" });
  // Whole months: from the first day of the first month to the last day of the last.
  const days = monthRangeDays(range);
  const from = days?.from ?? null;
  const to = days?.to ?? null;
  const table = useServerTable({ pageSize: 50, resetKey: `${kind}|${from?.getTime()}|${to?.getTime()}` });
  const arg = { ...audit, startDate: from ? apiDay(from) : "", endDate: to ? apiDay(to) : "", materialKind: kind, page: table.page, pageSize: table.pageSize };
  const expired = useGetApiV1MaterialBatchesExpiredQuery(arg, { skip: mode !== "expired" || !from });
  const soon = useGetApiV1MaterialBatchesAboutToExpireQuery(arg, { skip: mode !== "soon" || !from });
  const query = mode === "expired" ? expired : soon;
  const parsed = useMemo(() => query.data ? expiryRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  return <section className="page-fill">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">{title}</h1></div>
      <div className="flex flex-wrap items-end gap-3"><div className="w-72"><FormWizard form={form} fields={fields} /></div><KindSwitch tabs={kinds} kind={kind} onSelect={setKind} /></div>
    </div>
    {from ? <ServerDataTable label={title} columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      onRowOpen={(row) => void navigate(`/warehouse/${mode === "expired" ? "expired-materials" : "about-to-expire-materials"}/${encodeURIComponent(row.id)}?kind=${kind}`)}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned batches the app could not read." : null}
      emptyTitle="No batches in this period" emptyDescription={mode === "expired" ? "No batch of this kind expired in these months." : "No batch of this kind expires in these months."} />
      : <p role="status" className="rounded-md border bg-muted/50 p-3 text-sm">Choose the months to look at.</p>}
  </section>;
}
