import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useShipment, useShipments } from "../hooks/use-shipments";
import { createShipmentPath, shipmentKinds, shipmentPath, type ShipmentKind } from "../lib/shipment-kinds";
import type { Shipment } from "../schemas/shipment-schema";
import { AdvanceShipmentDialog } from "./advance-shipment-dialog";
import { ShipmentChargeLoader, type ChargeAction } from "./shipment-charge-actions";
import { ShipmentDetail } from "./shipment-detail";
import { ShipmentsTable } from "./shipments-table";

/** The list page of shipment documents or waybills. */
export function ShipmentListPage({ kind }: { kind: ShipmentKind }) {
  const config = shipmentKinds[kind];
  const list = useShipments(kind);
  const { has } = useAccess();
  const navigate = useNavigate();
  const [advancing, setAdvancing] = useState<Shipment | null>(null);
  const [charges, setCharges] = useState<{ shipment: Shipment; action: ChargeAction } | null>(null);
  const openCharges = useCallback((shipment: Shipment, action: ChargeAction) => setCharges({ shipment, action }), []);
  const closeCharges = useCallback(() => setCharges(null), []);
  const chargesFailed = useCallback((message: string) => { toast.error(message); }, []);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">LOGISTICS</p><h1 className="text-xl font-semibold">{config.title}</h1></div>
      {has(config.permissions.create) ? <Button asChild size="sm"><Link to={createShipmentPath(kind)}><Plus />New {config.singular}</Link></Button> : null}
    </div>
    <ShipmentsTable kind={kind} rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      onOpen={(row) => void navigate(shipmentPath(kind, row.id))} onAdvance={setAdvancing} onCharges={openCharges} />
    {advancing ? <AdvanceShipmentDialog key={advancing.id} kind={kind} shipment={advancing} onClose={() => setAdvancing(null)} /> : null}
    {charges ? <ShipmentChargeLoader key={`${charges.shipment.id}:${charges.action}`} action={charges.action} shipment={charges.shipment} onClose={closeCharges} onError={chargesFailed} /> : null}
  </section>;
}

function Detail({ kind, id }: { kind: ShipmentKind; id: string }) {
  const config = shipmentKinds[kind];
  const state = useShipment(kind, id);
  if (state.loading) return <DetailPageSkeleton label={`Loading ${config.singular}`} />;
  if (!state.shipment) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Document unavailable</h1><p className="text-sm text-muted-foreground">{state.error ?? "The server returned a document the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={state.retry}>Retry</Button><Button asChild size="sm"><Link to={config.root}>{config.title}</Link></Button></div></div>;
  return <ShipmentDetail kind={kind} shipment={state.shipment} />;
}

/** The detail page of one shipment document or waybill. */
export function ShipmentDetailPage({ kind }: { kind: ShipmentKind }) {
  const { id } = useParams();
  return id ? <Detail kind={kind} id={id} /> : null;
}
