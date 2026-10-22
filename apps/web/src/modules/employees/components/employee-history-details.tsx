import type { Employee } from "../api/employee-api";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { employeeTypeLabels, employeeStatusLabels, activeStatusLabels, inactiveStatusLabels } from "../lib/access";
import { religionOptions } from "../lib/employee-payload";
const gender = (value: number | undefined) => (value === 0 ? "Male" : value === 1 ? "Female" : null);
export function EmployeeHistoryDetails({ employee: e }: { employee: Employee }) {
  return (
    <div className="space-y-5">
      {" "}
      <section className="space-y-2">
        <h2 className="font-semibold">Children</h2>
        {e.children?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {e.children.map((row, index) => (
              <DetailGroup key={index} title={`Child ${index + 1}`}>
                <DetailItem label="Name" value={row.fullName} />
                <DetailItem label="Date of birth" value={formatDate(row.dateOfBirth)} />
                <DetailItem label="Gender" value={gender(row.gender)} />
              </DetailGroup>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No children recorded.</p>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Siblings</h2>
        {e.siblings?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {e.siblings.map((row, index) => (
              <DetailGroup key={index} title={`Sibling ${index + 1}`}>
                <DetailItem label="Name" value={row.fullName} />
                <DetailItem label="Contact" value={row.contact} />
                <DetailItem label="Gender" value={gender(row.gender)} />
              </DetailGroup>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No siblings recorded.</p>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Education and training</h2>
        {e.educationBackground?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {e.educationBackground.map((row, index) => (
              <DetailGroup key={index} title={row.schoolName ?? `Education ${index + 1}`}>
                <DetailItem label="Start date" value={formatDate(row.startDate)} />
                <DetailItem label="End date" value={formatDate(row.endDate)} />
                <DetailItem label="Major" value={row.major} />
                <DetailItem label="Qualification" value={row.qualificationEarned} />
              </DetailGroup>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No education recorded.</p>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Employment history</h2>
        {e.employmentHistory?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {e.employmentHistory.map((row, index) => (
              <DetailGroup key={index} title={row.companyName ?? `Employment ${index + 1}`}>
                <DetailItem label="Position" value={row.position} />
                <DetailItem label="Start date" value={formatDate(row.startDate)} />
                <DetailItem label="End date" value={formatDate(row.endDate)} />
              </DetailGroup>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No employment history recorded.</p>
        )}
      </section>
    </div>
  );
}
