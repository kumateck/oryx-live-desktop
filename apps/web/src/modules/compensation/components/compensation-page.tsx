import { useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { hrApi } from "@/shared/api/generated/hr";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { useAccess } from "@/shared/auth/use-access";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { compensationApi } from "../api/compensation-api";
import { CompensationRecord } from "./compensation-record";
import { CompensationHistory } from "./compensation-history";
import { SalaryEditor } from "./salary-editor";
import { AdjustmentsSection } from "./adjustments-section";
const selection = z.object({ employee: z.object({ value: z.uuid(), label: z.string() }).nullable() });
function EmployeeCompensation({ id, name }: { id: string; name: string }) {
  const query = compensationApi.useEmployeeCompensationQuery(id);
  const { has } = useAccess();
  const [editing, setEditing] = useState(false);
  const [revision, setRevision] = useState(0);
  const missing = query.error && "status" in query.error && query.error.status === 404;
  if (query.isLoading) return <DetailPageSkeleton label="Loading compensation" groups={3} />;
  if ((query.error && !missing) || (query.currentData && query.currentData.employeeId !== id))
    return (
      <section role="alert" className="space-y-3">
        <p>{query.error ? apiErrorMessage(query.error) : "Compensation belongs to another employee."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry compensation
        </Button>
      </section>
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="font-semibold">{name}</h2>
        {has("CanManageCompensation") && !editing ? (
          <Button
            onClick={() => {
              setRevision((value) => value + 1);
              setEditing(true);
            }}
          >
            Create new compensation
          </Button>
        ) : null}
      </div>
      {query.currentData ? (
        <CompensationRecord row={query.currentData} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No current compensation record. Create the initial record after verifying the employee's salary details.
        </p>
      )}
      {editing ? <SalaryEditor key={revision} employeeId={id} current={query.currentData ?? null} onClose={() => setEditing(false)} /> : null}
      <AdjustmentsSection key={`${id}:addition`} employeeId={id} kind="addition" />
      <AdjustmentsSection key={`${id}:deduction`} employeeId={id} kind="deduction" />
      <AdjustmentsSection key={`${id}:relief`} employeeId={id} kind="relief" />
      <CompensationHistory employeeId={id} />
    </div>
  );
}
export function CompensationPage() {
  const dispatch = useApiDispatch();
  const form = useForm<z.infer<typeof selection>>({ resolver: zodResolver(selection), defaultValues: { employee: null } });
  const employee = useWatch({ control: form.control, name: "employee" });
  const load = useCallback(
    async (searchQuery: string, page: number, signal: AbortSignal) => {
      const request = dispatch(
        hrApi.endpoints.getApiV1Employee.initiate(
          { module: "HR Management", subModule: "Employee Compensation", status: 0, page, pageSize: 30, searchQuery },
          { subscribe: false, forceRefetch: true },
        ),
      );
      const abort = () => request.abort();
      if (signal.aborted) {
        abort();
        throw new Error("Cancelled");
      }
      signal.addEventListener("abort", abort, { once: true });
      try {
        const result = await request.unwrap();
        return {
          options: (result.data ?? []).flatMap((row) =>
            row.id ? [{ value: row.id, label: `${row.firstName ?? ""} ${row.lastName ?? ""} · ${row.staffNumber ?? ""}`.trim() }] : [],
          ),
          hasNext: (result.pageIndex ?? page) < (result.pageCount ?? page),
          hasPrevious: page > 1,
        };
      } finally {
        signal.removeEventListener("abort", abort);
      }
    },
    [dispatch],
  );
  const fields: WizardField<z.infer<typeof selection>>[] = [
    { type: I.SELECT, name: "employee", label: "Employee", mode: "single", source: "async", loadOptions: load, placeholder: "Choose an active employee" },
  ];
  return (
    <section className="space-y-5">
      <PageHeader title="Employee compensation" crumbs={[{ label: "Human resources" }, { label: "Employee compensation" }]} />
      <div className="max-w-xl">
        <FormWizard form={form} fields={fields} />
      </div>
      {employee ? (
        <EmployeeCompensation key={employee.value} id={employee.value} name={employee.label} />
      ) : (
        <p className="text-sm text-muted-foreground">Choose an employee to view salary, allowances, adjustments, tax reliefs and compensation history.</p>
      )}
    </section>
  );
}
