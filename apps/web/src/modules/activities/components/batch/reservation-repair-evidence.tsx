import { formatDateTime } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { useReservationRepair } from "../../hooks/use-reservation-repair";
import type { ReservationRepairPreview, ReservationRepairReason, ReservationRepairRow } from "../../schemas/reservation-repair";
import { ReservationRepairRows } from "./reservation-repair-rows";

const fields = [
  { type: InputTypes.TEXTAREA, name: "reason", label: "Repair reason", required: true, rows: 2 },
] as const satisfies readonly WizardField<ReservationRepairReason>[];
const emptyRows: readonly ReservationRepairRow[] = [];

function RepairHistory({ repairs }: { repairs: ReservationRepairPreview["history"] }) {
  if (!repairs.length) return null;
  return <section className="space-y-2"><h2 className="font-semibold">Previous repairs</h2>
    {repairs.map((item) => <details key={item.id} className="border-t pt-2 text-sm">
      <summary className="cursor-pointer break-words rounded-sm focus-visible:outline-2 focus-visible:outline-ring">{formatDateTime(item.appliedAt)} · {item.actorName || item.actorId}</summary>
      <p className="my-2 break-words">{item.reason}</p><p className="mb-2 break-all text-xs text-muted-foreground">Reference: {item.id}</p>
      <ReservationRepairRows rows={item.rows} loading={false} />
    </details>)}
  </section>;
}

export function ReservationRepairEvidence({ state }: { state: ReturnType<typeof useReservationRepair> }) {
  const { preview } = state;
  const message = state.message || state.error || (!state.permission.allowed ? "Your current permissions do not allow this repair." : "");
  return <>
    {preview ? <p className="break-words text-sm">Current approved replacement: <strong>{preview.migrationFile}</strong></p> : null}
    <ReservationRepairRows rows={preview?.rows ?? emptyRows} loading={state.loading} />
    {preview?.blockers.length ? <div role="alert" className="space-y-1 text-sm text-destructive">
      <p className="font-medium">These reservations cannot be repaired automatically:</p>
      <ul className="list-disc space-y-1 pl-5">{[...new Set(preview.blockers)].map((blocker) => <li className="break-words" key={blocker}>{blocker}</li>)}</ul>
    </div> : null}
    {preview && !preview.hasChanges && preview.blockers.length === 0 ? <p role="status">This batch has no migration reservations needing repair.</p> : null}
    <FormWizard form={state.form} fields={fields} />
    {preview ? <RepairHistory repairs={preview.history} /> : null}
    {message ? <p role="alert" className="break-words text-sm text-destructive">{message}</p> : null}
    {state.needsReview ? <p role="status" className="text-sm">Reload and review the reservations and repair history before trying again.</p> : null}
  </>;
}
