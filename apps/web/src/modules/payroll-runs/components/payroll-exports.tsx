import { useAccess } from "@/shared/auth/use-access";
import { AttachmentOpener } from "@/shared/attachments/attachment-opener";
import { payrollPermissions as p } from "../schemas/contracts";
import { readPayrollExport } from "../lib/read-export";
export function PayrollExports({ id }: { id: string }) {
  const { has, allowsNow } = useAccess();
  if (!has(p.advice) && !has(p.register)) return null;
  return (
    <section className="space-y-2">
      <h2 className="font-semibold">Payroll exports</h2>
      <p className="text-sm text-muted-foreground">
        Open the original server-generated workbook in the read-only attachment viewer. Bank advice uses the employee's current compensation bank details, which
        may differ from those in force during this payroll period. Verify the accounts before using it for payment.
      </p>
      <div className="flex flex-wrap gap-3">
        {has(p.advice) ? (
          <AttachmentOpener
            file={{ id: `${id}:advice`, name: "Bank advice.xlsx", link: null, read: (signal) => readPayrollExport(id, "advice", signal, allowsNow) }}
          />
        ) : null}
        {has(p.register) ? (
          <AttachmentOpener
            file={{ id: `${id}:register`, name: "Payroll register.xlsx", link: null, read: (signal) => readPayrollExport(id, "register", signal, allowsNow) }}
          />
        ) : null}
      </div>
    </section>
  );
}
