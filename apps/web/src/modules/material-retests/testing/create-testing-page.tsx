import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { qcApi } from "@/shared/api/generated/qc";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { RecordState } from "@/shared/workflows/record-state";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { retestSchema, retestAudit as audit, retestPath, type MaterialRetest } from "../schemas/retest";
const schema = z.object({ specification: z.object({ value: z.string().min(1), label: z.string() }).nullable().refine((value): boolean => value !== null, "Choose an effective specification"),
  arNumber: z.string().trim().min(1).max(100), issueNumber: z.string().trim().max(100), reason: z.string().trim().min(3).max(1000),
});
type Values = z.infer<typeof schema>;
function CreateTesting({ record }: { record: MaterialRetest }) {
  const navigate = useNavigate();
  const [specifications] = qcApi.useLazyGetApiV1QcWorksheetsSpecificationsQuery();
  const [read] = qcApi.useLazyGetApiV1QcMaterialRetestsByIdQuery();
  const [create] = qcApi.usePostApiV1QcMaterialRetestsByIdTestRequestCreateMutation();
  const command = useVerifiedMutation<MaterialRetest>({ kind: "all", permissions: ["CanLinkMaterialRetestTestRequest", "CanCreateUnscheduledQcTestRequest", "CanViewQcSpecifications"] });
  const [review, setReview] = useState<Values | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { specification: null, arNumber: "", issueNumber: "", reason: record.reason ?? "Retest" } });
  const load = useCallback<SelectLoader>(async (search, page, signal) => {
    const query = specifications({ ...audit, status: 3, appliesTo: record.materialKind, searchQuery: search, page, pageSize: 30 }, false);
    signal.addEventListener("abort", () => query.abort(), { once: true });
    const result = await query.unwrap();
    return { options: (result.data ?? []).flatMap((row) => row.id ? [{ value: row.id, label: `${row.code ?? "Specification"} · ${row.name ?? ""} · version ${row.version}` }] : []), hasNext: page < (result.pageCount ?? page), hasPrevious: page > 1 };
  }, [specifications, record.materialKind]);
  const fields: WizardField<Values>[] = [
    { type: InputTypes.SELECT, name: "specification", label: "Effective specification version", mode: "single", source: "async", loadOptions: load, required: true },
    { type: InputTypes.TEXT, name: "arNumber", label: "Retest AR number", required: true },
    { type: InputTypes.TEXT, name: "issueNumber", label: "Issue number" },
    { type: InputTypes.TEXTAREA, name: "reason", label: "Reason for unscheduled testing", required: true },
  ];
  const submit = form.handleSubmit((values) => setReview(structuredClone(values)));
  return <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}><FormWizard form={form} fields={fields} className="md:grid-cols-2" />
    <p className="text-sm text-muted-foreground">The server pins this specification and its worksheet versions. Creation and linking to this retest happen in one transaction.</p>
    <Button type="submit" disabled={record.status !== 3 || !command.allowed}>Review testing request</Button>
    {review ? <ConfirmActionDialog title="Create and link testing?" description={`Specification ${review.specification?.label ?? ""}, AR ${review.arNumber}, batch ${record.batchNumber ?? record.materialBatchId}.`}
      destructive={false} require={{ kind: "all", permissions: ["CanLinkMaterialRetestTestRequest", "CanCreateUnscheduledQcTestRequest"] }} confirmLabel="Create linked testing" busyLabel="Verifying…" onClose={() => setReview(null)} onConfirm={async () => command.run(record,
        async () => retestSchema.parse(await read({ ...audit, id: record.id }, false).unwrap()), async (fresh) => {
          if (fresh.status !== 3 || fresh.testRequestId || !review.specification) throw new Error("This retest is no longer awaiting a new testing request.");
          const result = await create({ ...audit, id: fresh.id, domainEntitiesQcWorksheetsCreateTestRequestRequest: {
            type: fresh.materialKind, specificationId: review.specification.value, scheduleOrigin: 1, unscheduledReason: review.reason, arNumber: review.arNumber,
            issueNumber: review.issueNumber || null, subjects: [{ materialBatchId: fresh.materialBatchId, subjectRef: fresh.batchNumber || fresh.materialBatchId, subjectLabel: fresh.batchNumber || "Retest batch", arNumber: review.arNumber }],
          } });
          if ("error" in result) throw new Error(apiErrorMessage(result.error));
          void navigate(`${retestPath(fresh.id)}/testing`);
        })} /> : null}
  </form>;
}
export function CreateRetestTestingPage() {
  const { id = "" } = useParams();
  const query = qcApi.useGetApiV1QcMaterialRetestsByIdQuery({ ...audit, id });
  const parsed = retestSchema.safeParse(query.data);
  return <article className="min-w-0 space-y-4"><PageHeader title="Create retest testing" crumbs={[{ label: "Material retests", to: "/qc/material-retests" }, { label: "Retest", to: retestPath(id) }, { label: "Create testing" }]} />
    <RecordState loading={query.isLoading} data={parsed.success ? parsed.data : null} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(record) => <CreateTesting record={record} />}</RecordState>
  </article>;
}
