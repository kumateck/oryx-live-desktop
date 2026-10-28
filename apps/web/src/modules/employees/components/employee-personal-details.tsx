import type { Employee } from "../api/employee-api";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { employeeTypeLabels, employeeStatusLabels, activeStatusLabels, inactiveStatusLabels } from "../lib/access";
import { religionOptions } from "../lib/employee-payload";
const gender = (value: number | undefined) => (value === 0 ? "Male" : value === 1 ? "Female" : null);
export function EmployeePersonalDetails({ employee: e }: { employee: Employee }) {
  return (
    <DetailGroup title="Personal information">
      <DetailItem label="First name" value={e.firstName} />
      <DetailItem label="Last name" value={e.lastName} />
      <DetailItem label="Email" value={e.email} />
      <DetailItem label="Phone number" value={e.phoneNumber} />
      <DetailItem label="Birth date" value={formatDate(e.dateOfBirth)} />
      <DetailItem label="Gender" value={gender(e.gender)} />
      <DetailItem label="Nationality" value={e.nationality} />
      <DetailItem label="Region" value={e.region} />
      <DetailItem label="Residential address" value={e.residentialAddress} />
      <DetailItem label="Marital status" value={e.maritalStatus === 0 ? "Single" : e.maritalStatus === 1 ? "Married" : null} />
      <DetailItem label="Religion" value={e.religion === undefined ? null : religionOptions[e.religion]?.label} />
    </DetailGroup>
  );
}
