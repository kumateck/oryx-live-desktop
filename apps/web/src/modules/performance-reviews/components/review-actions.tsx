import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { DropdownButton } from "@/shared/actions";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ReviewStatus, type Review } from "@/shared/performance/contracts";
import { useReviewDecision } from "../hooks/use-review-decision";
const schema = z.object({ comments: z.string().max(2000) });
const fields: WizardField<z.infer<typeof schema>>[] = [{ type: I.TEXTAREA, name: "comments", label: "Decision comments" }];
function Decision({ row, action, onClose }: { row: Review; action: "approve" | "reject"; onClose: () => void }) {
  const run = useReviewDecision(row, action);
  const gate = usePermissionAction("CanApprovePerformanceReview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { comments: "" } });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action === "approve" ? "Approve performance review" : "Reject performance review"}</DialogTitle>
          <DialogDescription>
            {row.employeeName ?? "Employee"} · {row.cycleName ?? "Cycle"}.{" "}
            {action === "approve"
              ? "Verify the full assessment and goal ratings before confirming."
              : "Explain why this assessment must return to manager review."}
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (v) => {
            if (busy) return;
            setBusy(true);
            try {
              const problem = await run(v.comments);
              if (problem) setError(problem);
              else onClose();
            } finally {
              setBusy(false);
            }
          })}
        >
          <DialogBody>
            <fieldset disabled={busy || !gate.allowed}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {error ? (
              <p role="alert" className="text-destructive">
                {error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
              Cancel
            </Button>
            <Button variant={action === "reject" ? "destructive" : "default"} disabled={busy || !gate.allowed}>
              {busy ? "Submitting…" : action === "approve" ? "Approve review" : "Reject review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function ReviewActions({ row }: { row: Review }) {
  const [decision, setDecision] = useState<{ row: Review; action: "approve" | "reject" } | null>(null);
  return (
    <>
      <DropdownButton
        label="Review actions"
        items={
          row.status !== ReviewStatus.PendingApproval || row.approved
            ? []
            : [
                {
                  id: "approve",
                  label: "Approve review",
                  icon: Check,
                  require: { kind: "all", permissions: ["CanApprovePerformanceReview", "CanViewTeamGoals", "CanViewOwnGoals"] },
                  onSelect: () => setDecision({ row: structuredClone(row), action: "approve" }),
                },
                {
                  id: "reject",
                  label: "Reject review",
                  icon: X,
                  destructive: true,
                  require: "CanApprovePerformanceReview",
                  onSelect: () => setDecision({ row: structuredClone(row), action: "reject" }),
                },
              ]
        }
      />
      {decision ? <Decision row={decision.row} action={decision.action} onClose={() => setDecision(null)} /> : null}
    </>
  );
}
