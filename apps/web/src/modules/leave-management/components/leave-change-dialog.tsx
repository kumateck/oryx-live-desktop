import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { readAllPages } from "@/shared/api/read-all-pages";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { leaveApi } from "../api/leave-api";
import {
  leaveAudit,
  leavePermissions as p,
  day,
  mayRecall,
  recallBalanceProblem,
  uniqueRecallTarget,
  employeeName,
  LeaveStatus,
  type Leave,
} from "../lib/leave";
import { changeSchema, changeProblem, type LeaveChangeValues } from "../schemas/leave-schema";
import { useLeaveAction } from "../hooks/use-leave-action";
export function LeaveChangeDialog({ row, kind, onClose }: { row: Leave; kind: "recall" | "reapply"; onClose: () => void }) {
  const action = useLeaveAction(row, kind === "recall" ? p.recall : p.edit, onClose);
  const form = useForm<LeaveChangeValues>({ resolver: zodResolver(changeSchema), defaultValues: { date: null, end: null, reason: "" } });
  const [list] = leaveApi.useLazyGetApiV1LeaveRequestQuery();
  const [recall] = leaveApi.usePutApiV1LeaveRequestRecallMutation();
  const [reapply] = leaveApi.usePutApiV1LeaveRequestByLeaveRequestIdReapplyMutation();
  const fields: WizardField<LeaveChangeValues>[] = [
    { type: I.DATE, name: "date", label: kind === "recall" ? "Return date" : "New start date", required: true },
    ...(kind === "reapply" ? [{ type: I.DATE, name: "end", label: "New end date", required: true } satisfies WizardField<LeaveChangeValues>] : []),
    { type: I.TEXTAREA, name: "reason", label: "Reason", required: true, rows: 4 },
  ];
  const submit = form.handleSubmit((values) =>
    action.run(
      async (fresh, check) => {
        const problem = changeProblem(fresh, kind, values);
        if (problem || !values.date) return problem ?? "Choose a date.";
        if (kind === "recall") {
          if (!fresh.employeeId || !mayRecall(fresh)) return "Only ongoing approved leave or official duty can be recalled.";
          const balanceProblem = recallBalanceProblem(fresh);
          if (balanceProblem) return balanceProblem;
          // The server chooses its first approved request for this employee, even if it is historical.
          // Require a unique approved request across complete pages before allowing that employee-only command.
          const approved = await readAllPages(
            (page) =>
              list(
                {
                  ...leaveAudit,
                  page,
                  pageSize: 100,
                  status: LeaveStatus.Approved,
                  ...(fresh.employee?.department?.id ? { departmentId: fresh.employee.department.id } : {}),
                },
                false,
              ).unwrap(),
            (item) => item.id,
            new AbortController().signal,
          );
          if (!uniqueRecallTarget(fresh, approved))
            return "The server recall command cannot identify this request safely because this employee has multiple approved requests. Ask an administrator to resolve the server recall contract.";
          const revoked = check();
          if (revoked) return revoked;
          const result = await recall({
            ...leaveAudit,
            domainEntitiesLeaveRequestsCreateLeaveRecallRequest: {
              employeeId: fresh.employeeId,
              recallDate: `${day(values.date)}T00:00:00Z`,
              recallReason: values.reason,
            },
          });
          return "error" in result ? apiErrorMessage(result.error) : null;
        }
        if (!fresh.id || !values.end || fresh.leaveStatus !== LeaveStatus.Rejected) return "Only rejected requests can be reapplied.";
        const revoked = check();
        if (revoked) return revoked;
        const result = await reapply({
          ...leaveAudit,
          leaveRequestId: fresh.id,
          domainEntitiesLeaveRequestsReapplyLeaveRequest: {
            newStartDate: `${day(values.date)}T00:00:00Z`,
            newEndDate: `${day(values.end)}T00:00:00Z`,
            justification: values.reason,
          },
        });
        return "error" in result ? apiErrorMessage(result.error) : null;
      },
      kind === "recall" ? "Employee recalled from leave" : "Rejected leave request reapplied",
    ),
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !action.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === "recall" ? "Recall employee" : "Reapply rejected request"}</DialogTitle>
          <DialogDescription>
            {employeeName(row)}.{" "}
            {kind === "recall"
              ? "The return date must be within the approved period. The server adjusts the remaining leave balance."
              : "This replaces the dates and reason and resets the request's approval records for review."}
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4">
          <DialogBody>
            <fieldset disabled={action.busy || !action.allowed}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {action.error ? (
              <p role="alert" className="text-sm text-destructive">
                {action.error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={action.busy} onClick={onClose}>
              Back
            </Button>
            <Button disabled={action.busy || !action.allowed}>{action.busy ? "Sending…" : "Confirm change"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
