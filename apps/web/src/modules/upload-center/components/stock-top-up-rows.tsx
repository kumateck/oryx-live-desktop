import { useMemo } from "react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { openingBalancePermissions } from "../lib/stock-migration";
import type { TopUpLineValues } from "../schemas/stock-top-up-schema";

export type TopUpRow = TopUpLineValues & { id: string };
const column = dataTableColumns<TopUpRow>();

export function StockTopUpRows({ rows, disabled, edit, remove }: {
  rows: TopUpRow[]; disabled: boolean; edit: (row: TopUpRow) => void; remove: (id: string) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("materialCode", { header: "Material / batch", cell: ({ row }) => <div className="break-words"><div className="font-medium">{row.original.materialCode}</div><div>{row.original.batchNumber}</div></div> }),
    column.accessor("quantity", { header: "Quantity / base UOM", cell: ({ row }) => <div>{row.original.quantity}<div className="text-xs text-muted-foreground">{row.original.unitSymbol}</div></div> }),
    column.accessor("shelfName", { header: "Location", cell: ({ row }) => <div className="break-words">{row.original.warehouseName || "Resolve from department"}<div className="text-xs">{row.original.shelfName || "First shelf (review in draft)"}</div></div> }),
    column.accessor("expiry", { header: "Manufactured / expiry", cell: ({ row }) => <div>{row.original.manufactured || "–"}<div>{row.original.expiry || "–"}</div></div> }),
    column.accessor("grn", { header: "GRN / AR", cell: ({ row }) => <div className="break-words">{row.original.grn || "–"}<div>{row.original.arNumber || "–"}</div></div> }),
    column.display({ id: "actions", header: () => <TableMenuHeader />, size: 48, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.materialCode} batch ${row.original.batchNumber}`} disabled={disabled} items={[
      { id: "edit", label: "Edit line", require: openingBalancePermissions.upload, onSelect: () => edit(row.original) },
      { id: "remove", label: "Remove line", require: openingBalancePermissions.upload, onSelect: () => remove(row.original.id), destructive: true },
    ]} /> }),
  ]), [disabled, edit, remove]);
  return <ClientDataTable label="Top-up lines to save" columns={columns} rows={rows} getRowId={(row) => row.id} fill={false}
    emptyTitle="No top-up lines yet" emptyDescription="Add each material batch, then save the list once as a draft." />;
}
