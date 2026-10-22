import type { DomainEntitiesEmployeesCreateEmployeeRequest as Request, DomainEntitiesEmployeesEmployeeDto as Employee } from "@/shared/api/generated/hr";
import type { EmployeeValues } from "../schemas/employee-schema";
import { emptyEmployee } from "../schemas/employee-schema";
import { EmployeeType } from "./access";
export const enumOptions = (labels: readonly string[]) => labels.map((label, index) => ({ value: String(index), label }));
export const genderOptions = [{ value: "0", label: "Male" }, { value: "1", label: "Female" }] as const;
export const lifeOptions = [{ value: "0", label: "Living" }, { value: "1", label: "Deceased" }] as const;
export const maritalOptions = [{ value: "0", label: "Single" }, { value: "1", label: "Married" }] as const;
export const religionOptions = ["Christianity", "Islam", "Hinduism", "Buddhism", "Judaism", "Traditional African religions", "Sikhism", "Bahai", "Other"].map((label, value) => ({ value: String(value), label }));
const binary = (value: { value: "0" | "1" } | null): 0 | 1 | undefined => value?.value === "0" ? 0 : value?.value === "1" ? 1 : undefined;
const religion = (value: EmployeeValues["religion"]) => {
  switch (value?.value) { case "0": return 0; case "1": return 1; case "2": return 2; case "3": return 3; case "4": return 4; case "5": return 5; case "6": return 6; case "7": return 7; case "8": return 8; default: return undefined; }
};
const day = (date: Date | null) => date ? { value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T00:00:00Z` } : null;
const family = (value: EmployeeValues["father"]) => { const lifeStatus = binary(value.lifeStatus); return { fullName: value.fullName || null, phoneNumber: value.phoneNumber || null, occupation: value.occupation || null, ...(lifeStatus === undefined ? {} : { lifeStatus }) }; };
export function employeePayload(v: EmployeeValues, type: EmployeeType): Request {
  const gender = binary(v.gender); const maritalStatus = binary(v.maritalStatus); const faith = religion(v.religion); const birth = day(v.dateOfBirth); const employed = day(v.dateEmployed);
  return { firstName: v.firstName, lastName: v.lastName, type, ...(gender === undefined ? {} : { gender }), ...(birth ? { dateOfBirth: birth.value } : {}), ...(employed ? { dateEmployed: employed.value } : {}),
    phoneNumber: v.phoneNumber || null, region: v.region || null, nationality: v.nationality?.value ?? null, residentialAddress: v.residentialAddress || null,
    ...(maritalStatus === undefined ? {} : { maritalStatus }), ...(faith === undefined ? {} : { religion: faith }), bankAccountNumber: v.bankAccountNumber || null, ssnitNumber: v.ssnitNumber || null, ghanaCardNumber: v.ghanaCardNumber || null, staffNumber: v.staffNumber || null, email: v.email || null,
    father: family(v.father), mother: family(v.mother), spouse: family(v.spouse), emergencyContact: v.emergencyContact, nextOfKin: v.nextOfKin,
    children: v.children.map((child) => { const gender = binary(child.gender); const birth = day(child.dateOfBirth); return { fullName: child.fullName || null, ...(gender === undefined ? {} : { gender }), ...(birth ? { dateOfBirth: birth.value } : {}) }; }),
    siblings: v.siblings.map((sibling) => { const gender = binary(sibling.gender); return { fullName: sibling.fullName || null, contact: sibling.contact || null, ...(gender === undefined ? {} : { gender }) }; }),
    educationBackground: v.educationBackground.map((row) => { const start = day(row.startDate); const end = day(row.endDate); return { schoolName: row.schoolName || null, major: row.major || null, qualificationEarned: row.qualificationEarned || null, ...(start ? { startDate: start.value } : {}), ...(end ? { endDate: end.value } : {}) }; }),
    employmentHistory: v.employmentHistory.map((row) => { const start = day(row.startDate); const end = day(row.endDate); return { companyName: row.companyName || null, position: row.position || null, ...(start ? { startDate: start.value } : {}), ...(end ? { endDate: end.value } : {}) }; }),
  };
}
const date = (value: string | undefined) => value && Number.isFinite(Date.parse(value)) ? new Date(value) : null;
const pickBinary = (value: number | undefined, options: readonly { value: "0" | "1"; label: string }[]) => options.find((option) => Number(option.value) === value) ?? null;
export function employeeFormValues(e: Employee): EmployeeValues {
  const blank = emptyEmployee();
  const person = (value: Employee["father"]) => ({ fullName: value?.fullName ?? "", phoneNumber: value?.phoneNumber ?? "", occupation: value?.occupation ?? "", lifeStatus: pickBinary(value?.lifeStatus, lifeOptions) });
  const contact = (value: Employee["emergencyContact"]) => ({ fullName: value?.fullName ?? "", contactNumber: value?.contactNumber ?? "", relationship: value?.relationship ?? "", residentialAddress: value?.residentialAddress ?? "" });
  const faith = e.religion === undefined ? null : { value: String(e.religion), label: religionOptions[e.religion]?.label ?? `Unknown (${e.religion})` };
  // The schema validates the full mapped record before the edit form can write it.
  const mapped = { ...blank, firstName: e.firstName ?? "", lastName: e.lastName ?? "", dateOfBirth: date(e.dateOfBirth), gender: pickBinary(e.gender, genderOptions), phoneNumber: e.phoneNumber ?? "", region: e.region ?? "", nationality: e.nationality ? { value: e.nationality, label: e.nationality } : null, residentialAddress: e.residentialAddress ?? "", maritalStatus: pickBinary(e.maritalStatus, maritalOptions), religion: faith,
    dateEmployed: date(e.dateEmployed), bankAccountNumber: e.bankAccountNumber ?? "", ssnitNumber: e.ssnitNumber ?? "", ghanaCardNumber: e.ghanaCardNumber ?? "", staffNumber: e.staffNumber ?? "", email: e.email ?? "", father: person(e.father), mother: person(e.mother), spouse: person(e.spouse), emergencyContact: contact(e.emergencyContact), nextOfKin: contact(e.nextOfKin),
    children: (e.children ?? []).map((row) => ({ fullName: row.fullName ?? "", dateOfBirth: date(row.dateOfBirth), gender: pickBinary(row.gender, genderOptions) })), siblings: (e.siblings ?? []).map((row) => ({ fullName: row.fullName ?? "", contact: row.contact ?? "", gender: pickBinary(row.gender, genderOptions) })),
    educationBackground: (e.educationBackground ?? []).map((row) => ({ schoolName: row.schoolName ?? "", startDate: date(row.startDate), endDate: date(row.endDate), major: row.major ?? "", qualificationEarned: row.qualificationEarned ?? "" })), employmentHistory: (e.employmentHistory ?? []).map((row) => ({ companyName: row.companyName ?? "", position: row.position ?? "", startDate: date(row.startDate), endDate: date(row.endDate) })),
  };
  // Religion is a numeric external contract; map it through the matching schema, not an unchecked enum cast.
  const parsedFaith = religionValue.safeParse(faith);
  return { ...mapped, religion: parsedFaith.success ? parsedFaith.data : null };
}
import { z } from "zod";
const religionValue = z.object({ value: z.enum(["0", "1", "2", "3", "4", "5", "6", "7", "8"]), label: z.string() }).nullable();
