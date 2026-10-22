import type { Employee } from "../api/employee-api";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { employeeTypeLabels, employeeStatusLabels, activeStatusLabels, inactiveStatusLabels } from "../lib/access";
import { religionOptions } from "../lib/employee-payload";
const gender = (value: number | undefined) => (value === 0 ? "Male" : value === 1 ? "Female" : null);
export function EmployeeFamilyDetails({ employee: e }: { employee: Employee }) {
  return (
    <>
      {" "}
      {[
        { label: "Father", value: e.father },
        { label: "Mother", value: e.mother },
        { label: "Spouse", value: e.spouse },
      ].map(({ label, value }) => (
        <DetailGroup key={label} title={label}>
          <DetailItem label="Full name" value={value?.fullName} />
          <DetailItem label="Phone number" value={value?.phoneNumber} />
          <DetailItem label="Occupation" value={value?.occupation} />
          <DetailItem label="Life status" value={value?.lifeStatus === 0 ? "Living" : value?.lifeStatus === 1 ? "Deceased" : null} />
        </DetailGroup>
      ))}
      {[
        { label: "Emergency contact", value: e.emergencyContact },
        { label: "Next of kin", value: e.nextOfKin },
      ].map(({ label, value }) => (
        <DetailGroup key={label} title={label}>
          <DetailItem label="Full name" value={value?.fullName} />
          <DetailItem label="Contact number" value={value?.contactNumber} />
          <DetailItem label="Relationship" value={value?.relationship} />
          <DetailItem label="Residential address" value={value?.residentialAddress} />
        </DetailGroup>
      ))}
      <DetailGroup title="Payment information">
        <DetailItem label="Abii National account number" value={e.bankAccountNumber} />
        <DetailItem label="SSNIT number" value={e.ssnitNumber} />
        <DetailItem label="Ghana card number" value={e.ghanaCardNumber} />
      </DetailGroup>
    </>
  );
}
