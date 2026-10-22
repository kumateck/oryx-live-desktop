import { lazy, Suspense, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { TableMenu } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { assignmentKey, employeeName, type Assignment, type Schedule, type ShiftEmployee } from "../schemas/contracts";
import { scheduleWriteProblem } from "../lib/calendar";
const Swap = lazy(() => import("./swap-dialog").then((m) => ({ default: m.SwapDialog })));
interface Row {
  id: string;
  assignment: Assignment;
  employee: ShiftEmployee;
}
export function CalendarRows({ schedule, rows, visible, onChanged }: { schedule: Schedule; rows: Assignment[]; visible: Assignment[]; onChanged: () => void }) {
  const [selected, setSelected] = useState<{ schedule: Schedule; rows: Assignment[]; row: Row } | null>(null);
  const c = dataTableColumns<Row>();
  const columns = c.columns([
    c.accessor((r) => r.assignment.scheduleDate.slice(0, 10), { id: "date", header: "Date" }),
    c.accessor((r) => r.assignment.shiftType.shiftName ?? "Not recorded", { id: "shift", header: "Shift" }),
    c.accessor((r) => r.assignment.shiftCategory.name ?? "Not recorded", { id: "category", header: "Category" }),
    c.accessor((r) => employeeName(r.employee), { id: "employee", header: "Employee" }),
    c.accessor((r) => r.employee.staffNumber ?? "Not recorded", { id: "staff", header: "Staff number" }),
    c.accessor((r) => r.employee.department ?? "Not recorded", { id: "department", header: "Department" }),
    c.accessor((r) => r.employee.designation ?? "Not recorded", { id: "designation", header: "Designation" }),
    c.display({
      id: "actions",
      header: "",
      size: 40,
      cell: ({ row }) => (
        <TableMenu
          label={`Actions for ${employeeName(row.original.employee)}`}
          items={
            scheduleWriteProblem(schedule)
              ? []
              : [
                  {
                    id: "swap",
                    label: "Replace employee",
                    icon: ArrowLeftRight,
                    require: { kind: "all", permissions: ["CanEditShiftSchedule", "CanViewEmployeeDetails", "CanViewShiftCategories"] },
                    onSelect: () => setSelected({ schedule: structuredClone(schedule), rows: structuredClone(rows), row: structuredClone(row.original) }),
                  },
                ]
          }
        />
      ),
    }),
  ]);
  const shown = visible.flatMap((assignment) =>
    assignment.employees.map((employee) => ({ id: `${assignmentKey(assignment)}:${employee.employeeId}`, assignment, employee })),
  );
  return (
    <>
      <ClientDataTable
        label="Scheduled employees"
        rows={shown}
        columns={columns}
        getRowId={(r) => r.id}
        initialPageSize={30}
        emptyTitle="No assignments in this period"
        emptyDescription="Choose another date or view, or assign employees to this schedule."
      />
      {selected ? (
        <Suspense fallback={<p role="status">Loading replacement form…</p>}>
          <Swap
            schedule={selected.schedule}
            rows={selected.rows}
            assignment={selected.row.assignment}
            employee={selected.row.employee}
            onClose={() => {
              setSelected(null);
              onChanged();
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
}
