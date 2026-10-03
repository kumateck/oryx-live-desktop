import { useEffect, useMemo, useState } from "react";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdQuery, useGetApiV1ProcurementShipmentDocumentQuery, useGetApiV1ProcurementWaybillByWaybillIdQuery, useGetApiV1ProcurementWaybillQuery,
  usePostApiV1ProcurementShipmentDocumentMutation, usePostApiV1ProcurementWaybillMutation } from "../api/shipment-api";
import { shipmentKinds, type ShipmentKind } from "../lib/shipment-kinds";
import { shipmentRowsSchema, shipmentSchema } from "../schemas/shipment-schema";

/** Shipment documents or waybills, paged and searched by the backend. Each kind has its own endpoint; only the one asked for is read. */
export function useShipments(kind: ShipmentKind) {
  const config = shipmentKinds[kind];
  const [busy, setBusy] = useState(false);
  const search = usePageSearch(config.title.toLowerCase(), busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const arg = { ...config.audit, page: table.page, pageSize: table.pageSize, searchQuery: search };
  const shipments = useGetApiV1ProcurementShipmentDocumentQuery(arg, { skip: kind !== "shipment" });
  const waybills = useGetApiV1ProcurementWaybillQuery(arg, { skip: kind !== "waybill" });
  const query = kind === "shipment" ? shipments : waybills;
  const parsed = useMemo(() => query.data ? shipmentRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return { rows, search, error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? `The server returned ${config.title.toLowerCase()} the app could not read.` : null,
    loading: query.isLoading, refreshing: query.isFetching && !query.isLoading, retry: () => { void query.refetch(); },
    paging: { page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange } };
}

export function useShipment(kind: ShipmentKind, id: string) {
  const audit = shipmentKinds[kind].audit;
  const shipment = useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdQuery({ ...audit, shipmentDocumentId: id }, { skip: kind !== "shipment" });
  const waybill = useGetApiV1ProcurementWaybillByWaybillIdQuery({ ...audit, waybillId: id }, { skip: kind !== "waybill" });
  const query = kind === "shipment" ? shipment : waybill;
  const parsed = useMemo(() => shipmentSchema.safeParse(query.data ?? null), [query.data]);
  return { shipment: parsed.success ? parsed.data : null, loading: query.isLoading, error: query.error ? apiErrorMessage(query.error) : null, retry: () => { void query.refetch(); } };
}

/** Creates a shipment document or a waybill; both take the same request. Returns the new id, or the reason it failed. */
export function useCreateShipment(kind: ShipmentKind) {
  const audit = shipmentKinds[kind].audit;
  const [createShipment, shipment] = usePostApiV1ProcurementShipmentDocumentMutation();
  const [createWaybill, waybill] = usePostApiV1ProcurementWaybillMutation();
  const create = async (body: { code: string; shipmentInvoiceId: string }): Promise<{ id: string } | { error: string }> => {
    const arg = { ...audit, domainEntitiesShipmentsRequestCreateShipmentDocumentRequest: body };
    const result = kind === "shipment" ? await createShipment(arg) : await createWaybill(arg);
    if ("error" in result) return { error: apiErrorMessage(result.error) };
    return typeof result.data === "string" && result.data ? { id: result.data } : { error: "The server did not say which document it created." };
  };
  return { create, creating: shipment.isLoading || waybill.isLoading };
}
