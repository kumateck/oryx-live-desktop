import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import type { EmployeeValues } from "../schemas/employee-schema";
import { genderOptions, lifeOptions, maritalOptions, religionOptions } from "./employee-payload";
export const personalFields: WizardField<EmployeeValues>[] = [
  { type: I.TEXT, name: "firstName", label: "First name", required: true }, { type: I.TEXT, name: "lastName", label: "Last name", required: true },
  { type: I.DATE, name: "dateOfBirth", label: "Date of birth", maxDate: new Date() }, { type: I.SELECT, name: "gender", label: "Gender", mode: "single", source: "sync", options: genderOptions, required: true },
  { type: I.EMAIL, name: "email", label: "Email" }, { type: I.TEXT, name: "phoneNumber", label: "Phone number" }, { type: I.TEXTAREA, name: "residentialAddress", label: "Residential address" },
  { type: I.TEXT, name: "region", label: "Region" }, { type: I.SELECT, name: "maritalStatus", label: "Marital status", mode: "single", source: "sync", options: maritalOptions },
  { type: I.SELECT, name: "religion", label: "Religion", mode: "single", source: "sync", options: religionOptions }, { type: I.DATE, name: "dateEmployed", label: "Date employed" }, { type: I.TEXT, name: "staffNumber", label: "Staff number" },
  { type: I.IMAGE, name: "photo", label: "Passport photograph", description: "PNG, JPEG or WebP, up to 5 MB. Existing photographs remain attached." },
];
export const paymentFields: WizardField<EmployeeValues>[] = [
  { type: I.TEXT, name: "bankAccountNumber", label: "Abii National account number" }, { type: I.TEXT, name: "ssnitNumber", label: "SSNIT number" }, { type: I.TEXT, name: "ghanaCardNumber", label: "Ghana card number", placeholder: "GHA-XXXXXXXXX-X" },
];
export function familyFields(name: "father" | "mother" | "spouse"): WizardField<EmployeeValues>[] {
  return [{ type: I.TEXT, name: `${name}.fullName`, label: "Full name" }, { type: I.TEXT, name: `${name}.phoneNumber`, label: "Phone number" }, { type: I.TEXT, name: `${name}.occupation`, label: "Occupation" }, { type: I.SELECT, name: `${name}.lifeStatus`, label: "Life status", mode: "single", source: "sync", options: lifeOptions }];
}
export function contactFields(name: "emergencyContact" | "nextOfKin"): WizardField<EmployeeValues>[] {
  return [{ type: I.TEXT, name: `${name}.fullName`, label: "Full name" }, { type: I.TEXT, name: `${name}.contactNumber`, label: "Contact number" }, { type: I.TEXT, name: `${name}.relationship`, label: "Relationship" }, { type: I.TEXTAREA, name: `${name}.residentialAddress`, label: "Residential address" }];
}
