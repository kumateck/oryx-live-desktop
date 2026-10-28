import { useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { NoAccess } from "@/shared/auth/no-access";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { toLargestUnit } from "@/shared/units/quantity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { productionTransfersApi } from "../api/transfers-api";
import { belongsToDepartment, directionPermission, TransferDirection, transferAudit, transferSchema, transfersPath } from "../lib/transfers";
import { TransferActions } from "./transfer-actions";
import { TransferStanding } from "./transfer-standing";

function TransferDetail({ id }: { id: string }) {
  const [params] = useSearchParams();
  const user = useCurrentUser();
  const { has } = useAccess();
  const direction = params.get("type") === "1" ? TransferDirection.Outgoing : TransferDirection.Incoming;
  const permitted = has(directionPermission(direction));
  const query = productionTransfersApi.useGetApiV1ProductionScheduleStockTransferByStockTransferIdQuery({ ...transferAudit, stockTransferId: id }, { skip: !permitted || !user?.departmentId, refetchOnMountOrArgChange: true });
  const parsed = transferSchema.safeParse(query.currentData);
  if (!permitted) return <NoAccess />;
  if (query.isLoading) return <DetailPageSkeleton label="Loading stock transfer" groups={4} />;
  if (!parsed.success || query.error) return <section role="alert" className="space-y-3"><h1 className="text-lg font-semibold">Transfer unavailable</h1><p>{query.error ? apiErrorMessage(query.error) : !user?.departmentId ? "Your account has no department." : "The server did not return a readable transfer."}</p><Button variant="outline" onClick={() => void query.refetch()}>Retry</Button></section>;
  const transfer = parsed.data;
  if (!belongsToDepartment(transfer, user?.departmentId ?? null, direction)) return <NoAccess />;
  return <article className="space-y-4">
    <PageHeader title={`Transfer of ${transfer.material?.name ?? "material"}`} crumbs={[{ label: "Stock transfers", to: `${transfersPath}?type=${direction}` }, { label: transfer.material?.code ?? "Details" }]}
      actions={<TransferActions transfer={transfer} direction={direction} detail />} />
    <TransferStanding status={transfer.status} />
    <KeyFacts><KeyFact label="Material" value={transfer.material?.name ?? "Not recorded"} note={transfer.material?.code} />
      <KeyFact label="Quantity" value={toLargestUnit(transfer.quantity, transfer.uoM?.symbol)?.text ?? "Not recorded"} />
      <KeyFact label="Supplying department" value={transfer.fromDepartment?.name ?? "Not recorded"} />
      <KeyFact label="Requested by" value={transfer.toDepartment?.name ?? "Not recorded"} />
      <KeyFact label="Requested" value={formatDateTime(transfer.createdAt) ?? "Not recorded"} /></KeyFacts>
    <dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-muted-foreground">Approved</dt><dd>{formatDateTime(transfer.approvedAt) ?? "Not recorded"}</dd></div><div><dt className="text-muted-foreground">Issued</dt><dd>{formatDateTime(transfer.issuedAt) ?? "Not recorded"}</dd></div></dl>
    <section className="space-y-2"><h2 className="font-semibold">Reason for transfer</h2>{transfer.reason ? <RichTextView html={transfer.reason} /> : <p className="text-muted-foreground">No reason recorded.</p>}</section>
    <p className="text-sm text-muted-foreground">Approved stock is issued and received through the warehouse transfer workflow. Reviewing this record does not move stock.</p>
  </article>;
}
export function ProductionTransferDetailPage() { const { id } = useParams(); return id ? <TransferDetail key={id} id={id} /> : <NoAccess />; }
