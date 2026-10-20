import { useMemo } from "react";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { z } from "zod";
import { hrApi } from "@/shared/api/generated/hr";
import { servicesApi } from "@/shared/api/generated/services";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate } from "@/shared/format/dates";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { audit } from "../../lib/approval-documents";
import { DetailState, fullName, queryState } from "./detail-state";

const { useGetApiV1LeaveRequestByIdQuery, useGetApiV1OvertimeRequestsByIdQuery, useGetApiV1StaffRequisitionsByIdQuery } = hrApi;
const { useGetApiV1JobRequestsByIdQuery } = servicesApi;

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : null);
const named = z.object({ name: text }).nullish();
const employee = z.object({ id: z.string().nullish(), firstName: text, lastName: text, staffNumber: text, department: named, designation: named });
const days = (value: number | null) => value === null ? null : `${formatQuantityNumber(value, "calculated")} ${value === 1 ? "day" : "days"}`;
function useParsed<T>(schema: z.ZodType<T>, data: unknown): T | null {
  return useMemo(() => { const parsed = schema.safeParse(data ?? null); return parsed.success ? parsed.data : null; }, [schema, data]);
}
/** Free text the requester wrote. It may carry formatting, which is shown, never run. */
function Written({ title, html }: { title: string; html: string | null }) {
  return html ? <section className="space-y-1 rounded-lg border bg-card p-4"><h3 className="text-sm font-semibold">{title}</h3><RichTextView html={html} className="text-sm" /></section> : null;
}

/** The kind of absence asked for. The numbers are the server's. */
const categories: Record<number, string> = { 0: "Leave", 1: "Absence", 2: "Exit pass", 3: "Official duty" };
const leaveSchema = z.object({ requestCategory: z.number().nullish(), leaveType: z.object({ name: text, isPaid: z.boolean().nullish() }).nullish(), startDate: z.string().nullish(), endDate: z.string().nullish(), numberOfDays: amount, paidDays: amount, unpaidDays: amount,
  leaveBalance: amount, contactPerson: text, contactPersonNumber: text, destination: text, justification: text, employee: employee.nullish(), attachments: z.array(z.object({ id: z.string().nullish(), name: text, link: text })).nullish() });
/** A request for time away: who, what kind, when, and what it does to their balance. */
export function LeaveRequestDetails({ id }: { id: string }) {
  const query = useGetApiV1LeaveRequestByIdQuery({ ...audit, id });
  const value = useParsed(leaveSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="leave request">{(leave) => { const after = leave.leaveBalance !== null && leave.paidDays !== null ? leave.leaveBalance - leave.paidDays : null;
    return <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <DetailGroup title="Employee"><DetailItem label="Name" value={fullName(leave.employee)} /><DetailItem label="Staff number" value={leave.employee?.staffNumber} /><DetailItem label="Department" value={leave.employee?.department?.name} />
          <DetailItem label="Designation" value={leave.employee?.designation?.name} /><DetailItem label="Contact while away" value={[leave.contactPerson, leave.contactPersonNumber].filter(Boolean).join(" · ")} /><DetailItem label="Destination" value={leave.destination} /></DetailGroup>
        <DetailGroup title="Request"><DetailItem label="Kind" value={leave.requestCategory === null || leave.requestCategory === undefined ? null : categories[leave.requestCategory]} />
          <DetailItem label="Leave type" value={leave.leaveType?.name ? `${leave.leaveType.name}${leave.leaveType.isPaid === false ? " (unpaid)" : ""}` : null} />
          <DetailItem label="From" value={formatDate(leave.startDate)} /><DetailItem label="To" value={formatDate(leave.endDate)} /><DetailItem label="Length" value={days(leave.numberOfDays)} />
          <DetailItem label="Paid / unpaid" value={leave.paidDays === null && leave.unpaidDays === null ? null : `${days(leave.paidDays ?? 0)} paid, ${days(leave.unpaidDays ?? 0)} unpaid`} />
          <DetailItem label="Leave balance" value={days(leave.leaveBalance)} /></DetailGroup>
      </div>
      {after !== null && after < 0 ? <p role="note" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">The paid days asked for are {days(-after)} more than the balance.</p> : null}
      <Written title="Justification" html={leave.justification} />
      {leave.attachments?.length ? <AttachmentList title="Attachments" files={leave.attachments.map((file, index) => ({ id: file.id ?? `attachment-${index}`, name: file.name ?? "Attachment", link: file.link }))} /> : null}
    </div>; }}</DetailState>;
}

const overtimeSchema = z.object({ code: text, overtimeDate: z.string().nullish(), startTime: text, endTime: text, totalHours: amount, justification: text, department: named, employees: z.array(employee).nullish() });
type Worker = z.infer<typeof employee> & { key: string };
const workerColumn = dataTableColumns<Worker>();
const workerColumns = workerColumn.columns([
  workerColumn.accessor((row) => fullName(row) ?? "", { id: "name", header: "Employee", cell: ({ row }) => <span className="break-words font-medium">{fullName(row.original) ?? "Unnamed"}</span> }),
  workerColumn.accessor((row) => row.staffNumber ?? "", { id: "staff", header: "Staff number", size: 160, cell: ({ row }) => row.original.staffNumber ?? "–" }),
  workerColumn.accessor((row) => row.designation?.name ?? "", { id: "designation", header: "Designation", cell: ({ row }) => row.original.designation?.name ?? "–" }),
]);
/** Overtime asked for a department: when, for how long, for whom. */
export function OvertimeRequestDetails({ id }: { id: string }) {
  const query = useGetApiV1OvertimeRequestsByIdQuery({ ...audit, id });
  const value = useParsed(overtimeSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="overtime request">{(overtime) => { const people = overtime.employees ?? []; const hours = overtime.totalHours;
    return <div className="space-y-4">
      <DetailGroup title="Overtime"><DetailItem label="Request" value={overtime.code} /><DetailItem label="Department" value={overtime.department?.name} /><DetailItem label="Date" value={formatDate(overtime.overtimeDate)} />
        <DetailItem label="Time" value={[overtime.startTime, overtime.endTime].filter(Boolean).join(" to ")} /><DetailItem label="Hours each" value={hours === null ? null : formatQuantityNumber(hours, "calculated")} />
        <DetailItem label="Hours in all" value={hours === null ? null : `${formatQuantityNumber(hours * people.length, "calculated")} for ${people.length} ${people.length === 1 ? "person" : "people"}`} /></DetailGroup>
      <Written title="Justification" html={overtime.justification} />
      <ClientDataTable label="Employees" columns={workerColumns} rows={people.map((person, index) => ({ ...person, key: person.id ?? `e-${index}` }))} getRowId={(row) => row.key} fill={false} emptyTitle="No employees are named" />
    </div>; }}</DetailState>;
}

const staffSchema = z.object({ staffRequired: amount, budgetStatus: z.number().nullish(), appointmentType: z.number().nullish(), requestUrgency: z.union([z.string(), z.number()]).nullish(), qualification: text, educationalQualification: text,
  additionalRequests: text, additionalRequirements: text, justification: text, departmentName: text, department: named, designation: named });
/** A request to hire: the post, how many, whether it is budgeted, and why. */
export function StaffRequisitionDetails({ id }: { id: string }) {
  const query = useGetApiV1StaffRequisitionsByIdQuery({ ...audit, id });
  const value = useParsed(staffSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="staff requisition">{(staff) => <div className="space-y-4">
    <DetailGroup title="Post"><DetailItem label="Designation" value={staff.designation?.name} /><DetailItem label="Department" value={staff.department?.name ?? staff.departmentName} />
      <DetailItem label="Staff required" value={staff.staffRequired === null ? null : String(staff.staffRequired)} /><DetailItem label="Appointment" value={staff.appointmentType === 0 ? "New appointment" : staff.appointmentType === 1 ? "Replacement" : null} />
      <DetailItem label="Budget" value={staff.budgetStatus === 0 ? "Budgeted" : staff.budgetStatus === 1 ? "Not budgeted" : null} /><DetailItem label="Needed by" value={typeof staff.requestUrgency === "string" ? formatDate(staff.requestUrgency) ?? staff.requestUrgency : null} />
      <DetailItem label="Qualification" value={staff.qualification} /><DetailItem label="Education" value={staff.educationalQualification} /></DetailGroup>
    {staff.budgetStatus === 1 ? <p role="note" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">This post is not in the budget.</p> : null}
    <Written title="Justification" html={staff.justification} /><Written title="Additional requirements" html={staff.additionalRequirements ?? staff.additionalRequests} />
  </div>}</DetailState>;
}

const person = z.object({ firstName: text, lastName: text }).nullish();
const jobSchema = z.object({ code: text, department: named, site: named, equipment: named, service: named, equipmentInstrumentNumber: text, item: text, itemNumber: text, dateOfIssue: z.string().nullish(), preferredCompletionDate: z.string().nullish(),
  descriptionOfWork: text, issuedBy: person, handlingType: z.number().nullish(), attachments: z.array(z.object({ id: z.string().nullish(), name: text, link: text })).nullish() });
const handling: Record<number, string> = { 0: "Not assigned", 1: "Internal", 2: "External" };
/** A request for maintenance or other work: on what, where, and by when. */
export function JobRequestDetails({ id }: { id: string }) {
  const query = useGetApiV1JobRequestsByIdQuery({ ...audit, id });
  const value = useParsed(jobSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="job request">{(job) => <div className="space-y-4">
    <DetailGroup title="Job"><DetailItem label="Request" value={job.code} /><DetailItem label="Department" value={job.department?.name} /><DetailItem label="Site" value={job.site?.name} />
      <DetailItem label="Equipment" value={[job.equipment?.name, job.equipmentInstrumentNumber].filter(Boolean).join(" · ")} /><DetailItem label="Item" value={[job.item, job.itemNumber].filter(Boolean).join(" · ")} /><DetailItem label="Service" value={job.service?.name} />
      <DetailItem label="Issued by" value={fullName(job.issuedBy)} /><DetailItem label="Issued on" value={formatDate(job.dateOfIssue)} /><DetailItem label="Wanted by" value={formatDate(job.preferredCompletionDate)} />
      <DetailItem label="Handled" value={job.handlingType === null || job.handlingType === undefined ? null : handling[job.handlingType]} /></DetailGroup>
    <Written title="Work to be done" html={job.descriptionOfWork} />
    {job.attachments?.length ? <AttachmentList title="Attachments" files={job.attachments.map((file, index) => ({ id: file.id ?? `attachment-${index}`, name: file.name ?? "Attachment", link: file.link }))} /> : null}
  </div>}</DetailState>;
}
