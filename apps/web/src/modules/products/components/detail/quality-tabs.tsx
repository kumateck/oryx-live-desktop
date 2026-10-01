import { Link } from "react-router";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import {
  useGetApiV1ProductArdProductByProductIdQuery, useGetApiV1ProductSpecificationsProductByIdQuery, useGetApiV1ProductStpsByProductIdProductQuery,
} from "../../api/product-api";
import { useParsedQuery } from "../../hooks/use-parsed-query";
import { audit } from "../../lib/product-access";
import { testStageLabel } from "../../lib/product-detail";
import {
  ardListSchema, specificationListSchema, stpListSchema, type ProductArd, type ProductSpecification, type ProductStp,
} from "../../schemas/product-detail-schema";

const dash = "–";
const linkClass = "font-medium underline-offset-2 hover:underline";

const stpColumn = dataTableColumns<ProductStp>();
const stpColumns = stpColumn.columns([
  stpColumn.accessor((stp) => stp.stpNumber ?? dash, { id: "number", header: "STP number" }),
  stpColumn.accessor((stp) => stp.createdBy ?? dash, { id: "createdBy", header: "Created by" }),
  stpColumn.accessor((stp) => formatDate(stp.createdAt) ?? dash, { id: "createdAt", header: "Created" }),
]);

export function StpTab({ productId }: { productId: string }) {
  const result = useParsedQuery(useGetApiV1ProductStpsByProductIdProductQuery({ ...audit, productId }), stpListSchema);
  return <ListDataTable label="Standard test procedure" columns={stpColumns} rows={result.rows} getRowId={(stp) => stp.id} loading={result.loading}
    refreshing={result.refreshing} error={result.error} onRetry={result.onRetry} emptyTitle="No standard test procedure" />;
}

const specColumn = dataTableColumns<ProductSpecification>();
const specColumns = specColumn.columns([
  specColumn.accessor((spec) => testStageLabel(spec.testStage) ?? dash, { id: "stage", header: "Stage" }),
  specColumn.accessor((spec) => spec.specificationNumber ?? dash, { id: "number", header: "Specification number", cell: ({ row }) =>
    <Link className={linkClass} to={`/qc/product-specification/${row.original.id}/details`}>{row.original.specificationNumber ?? "Open"}</Link> }),
  specColumn.accessor((spec) => formatDate(spec.effectiveDate) ?? dash, { id: "effective", header: "Effective" }),
  specColumn.accessor((spec) => formatDate(spec.reviewDate) ?? dash, { id: "review", header: "Review" }),
  specColumn.accessor((spec) => spec.revisionNumber ?? dash, { id: "revision", header: "Revision" }),
  specColumn.accessor((spec) => spec.supersedesNumber ?? dash, { id: "supersedes", header: "Supersedes" }),
]);

export function SpecificationsTab({ productId }: { productId: string }) {
  const result = useParsedQuery(useGetApiV1ProductSpecificationsProductByIdQuery({ ...audit, id: productId }), specificationListSchema);
  return <ListDataTable label="Product specifications" columns={specColumns} rows={result.rows} getRowId={(spec) => spec.id} loading={result.loading}
    refreshing={result.refreshing} error={result.error} onRetry={result.onRetry} emptyTitle="No specifications" />;
}

const ardColumn = dataTableColumns<ProductArd>();
const ardColumns = ardColumn.columns([
  ardColumn.accessor((ard) => ard.specNumber ?? dash, { id: "spec", header: "Specification number", cell: ({ row }) =>
    <Link className={linkClass} to={`/qc/product-analytical-raw-data/${row.original.id}`}>{row.original.specNumber ?? "Open"}</Link> }),
  ardColumn.accessor((ard) => ard.stpNumber ?? dash, { id: "stp", header: "STP number" }),
  ardColumn.accessor((ard) => testStageLabel(ard.stage) ?? dash, { id: "stage", header: "Stage" }),
  ardColumn.accessor((ard) => ard.form ?? dash, { id: "form", header: "Form" }),
  ardColumn.accessor((ard) => formatDate(ard.createdAt) ?? dash, { id: "createdAt", header: "Created" }),
]);

export function ArdTab({ productId }: { productId: string }) {
  const result = useParsedQuery(useGetApiV1ProductArdProductByProductIdQuery({ ...audit, productId }), ardListSchema);
  return <ListDataTable label="Analytical raw data" columns={ardColumns} rows={result.rows} getRowId={(ard) => ard.id} loading={result.loading}
    refreshing={result.refreshing} error={result.error} onRetry={result.onRetry} emptyTitle="No analytical raw data" />;
}
