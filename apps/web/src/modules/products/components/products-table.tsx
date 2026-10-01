import { useMemo } from "react";
import { Link } from "react-router";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { toLargestUnit } from "@/shared/units/quantity";
import { divisionLabel, productDetailPath, productPermissions } from "../lib/product-access";
import type { ProductRow } from "../schemas/product-schema";
import { QualityBadge, VerifyProductButton } from "./verify-product-button";

const column = dataTableColumns<ProductRow>();
const productId = (product: ProductRow) => product.id;
const dash = "–";

function Stacked({ top, bottom }: { top: string; bottom: string }) {
  return <div className="min-w-0 space-y-0.5"><div className="break-words text-sm font-medium">{top}</div>
    <div className="break-words text-xs text-muted-foreground">{bottom}</div></div>;
}

export interface ProductsTableProps {
  rows: readonly ProductRow[];
  search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRetry: () => void;
  onOpen: (product: ProductRow) => void;
}

export function ProductsTable({ rows, search, paging, loading, refreshing, error, onRetry, onOpen }: ProductsTableProps) {
  const columns = useMemo(() => column.columns([
    column.accessor((product) => product.name ?? dash, { id: "product", header: "Product", cell: ({ row }) =>
      <div className="min-w-0 space-y-0.5">
        <Link to={productDetailPath(row.original.id)} className="break-words font-medium hover:underline">{row.original.name ?? dash}</Link>
        <div className="break-words text-xs text-muted-foreground">{row.original.code ?? dash} · {row.original.category ?? dash}</div>
      </div> }),
    column.accessor((product) => product.department ?? dash, { id: "classification", header: "Classification", cell: ({ row }) =>
      <Stacked top={row.original.department ?? dash} bottom={divisionLabel(row.original.division) ?? dash} /> }),
    column.accessor((product) => product.fullBatchSize ?? 0, { id: "production", header: "Production", cell: ({ row }) => {
      const composition = toLargestUnit(row.original.baseQuantity, row.original.baseUoM);
      const batch = toLargestUnit(row.original.fullBatchSize, row.original.baseUoM);
      return <div className="min-w-0 space-y-0.5 text-sm">
        <div><span className="text-xs text-muted-foreground">Composition: </span>{composition?.text ?? dash}</div>
        <div><span className="text-xs text-muted-foreground">Master batch: </span>{batch?.text ?? dash}</div>
      </div>;
    } }),
    column.accessor((product) => product.shelfLife ?? "", { id: "regulatory", header: "Regulatory", cell: ({ row }) =>
      <Stacked top={row.original.shelfLife ?? dash} bottom={`${row.original.fdaRegistrationNumber ?? dash} · ${row.original.masterFormulaNumber ?? dash}`} /> }),
    column.accessor("isVerified", { header: "Quality", cell: ({ row }) => <QualityBadge verified={row.original.isVerified} /> }),
    column.display({ id: "actions", header: () => <span className="sr-only">Actions</span>, size: 110, enableHiding: false,
      cell: ({ row }) => <PermissionGuard require={productPermissions.verify}><VerifyProductButton product={row.original} /></PermissionGuard> }),
  ]), []);

  return <ServerDataTable label="Planned products" columns={columns} rows={rows} getRowId={productId} {...paging} loading={loading}
    refreshing={refreshing} error={error} onRetry={onRetry} columnToggle onRowOpen={onOpen}
    emptyTitle={search.trim() ? "No products match this search" : "No planned products yet"}
    emptyDescription={search.trim() ? "Check the spelling, or search by code." : undefined} />;
}
