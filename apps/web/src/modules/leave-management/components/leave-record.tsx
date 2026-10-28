import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import type { AttachedFile } from "@/shared/attachments/attachment-list";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { categories, statuses, label, employeeName, type Leave } from "../lib/leave";
export function leaveFiles(row: Leave): AttachedFile[] {
  return (row.attachments ?? []).map((file, index) => ({ id: file.id ?? `attachment-${index}`, name: file.name ?? "Attachment", link: file.link ?? null }));
}
export function leaveFacts(row: Leave) {
  return [
    { label: "Employee", value: employeeName(row) },
    { label: "Staff ID", value: row.employee?.staffNumber ?? "Not recorded" },
    { label: "Department", value: row.employee?.department?.name ?? "Not recorded" },
    { label: "Category", value: label(categories, row.requestCategory) },
    { label: "Status", value: label(statuses, row.leaveStatus) },
    { label: "Leave type", value: row.leaveType?.name ?? "Not applicable" },
    { label: "Starts", value: formatDate(row.startDate) ?? "Not recorded" },
    { label: "Ends", value: formatDate(row.endDate) ?? "Not recorded" },
    { label: "Requested", value: formatDateTime(row.createdAt) ?? "Not recorded" },
    { label: "Requested by", value: [row.createdBy?.firstName, row.createdBy?.lastName].filter(Boolean).join(" ") || "Not recorded" },
    { label: "Paid days", value: row.paidDays ?? "Not recorded" },
    { label: "Unpaid days", value: row.unpaidDays ?? "Not recorded" },
    { label: "Total days", value: row.numberOfDays ?? "Not recorded" },
    { label: "Days used", value: row.numberOfDaysUsed ?? "Not recorded" },
    { label: "Leave balance", value: row.leaveBalance ?? "Not recorded" },
    { label: "Recall date", value: formatDate(row.recallDate) ?? "Not recorded" },
    { label: "Contact person", value: row.contactPerson ?? "Not recorded" },
    { label: "Contact phone", value: row.contactPersonNumber ?? "Not recorded" },
    { label: "Destination", value: row.destination ?? "Not recorded" },
  ];
}
export function LeaveRecord({ row }: { row: Leave }) {
  return (
    <>
      <KeyFacts>
        {leaveFacts(row)
          .slice(0, 5)
          .map((fact) => (
            <KeyFact key={fact.label} {...fact} />
          ))}
      </KeyFacts>
      <dl className="grid gap-4 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3">
        {leaveFacts(row)
          .slice(5)
          .map((fact) => (
            <div key={fact.label}>
              <dt className="text-sm text-muted-foreground">{fact.label}</dt>
              <dd className="break-words">{fact.value}</dd>
            </div>
          ))}
      </dl>
      <section className="space-y-2">
        <h2 className="font-semibold">Justification</h2>
        {row.justification ? <RichTextView html={row.justification} /> : <p className="text-muted-foreground">No justification recorded.</p>}
      </section>
    </>
  );
}
