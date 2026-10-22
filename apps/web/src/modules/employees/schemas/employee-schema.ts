import { z } from "zod";
const text = z.string().trim();
const option = z.object({ value: z.string().min(1), label: z.string() }).nullable();
const binary = z.object({ value: z.enum(["0", "1"]), label: z.string() }).nullable();
const religion = z.object({ value: z.enum(["0", "1", "2", "3", "4", "5", "6", "7", "8"]), label: z.string() }).nullable();
const date = z.date().nullable();
export const familyMemberSchema = z.object({ fullName: text.max(200), phoneNumber: text.max(50), occupation: text.max(200), lifeStatus: binary });
export const contactSchema = z.object({ fullName: text.max(200), contactNumber: text.max(50), relationship: text.max(100), residentialAddress: text.max(500) });
export const childSchema = z.object({ fullName: text.max(200), dateOfBirth: date, gender: binary });
export const siblingSchema = z.object({ fullName: text.max(200), contact: text.max(50), gender: binary });
export const educationSchema = z.object({ schoolName: text.max(200), startDate: date, endDate: date, major: text.max(200), qualificationEarned: text.max(200) }).refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, { path: ["endDate"], message: "End date must be on or after the start date." });
export const employmentSchema = z.object({ companyName: text.max(200), position: text.max(200), startDate: date, endDate: date }).refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, { path: ["endDate"], message: "End date must be on or after the start date." });
export const employeeSchema = z.object({
  firstName: text.min(1, "First name is required").max(100), lastName: text.min(1, "Last name is required").max(100), dateOfBirth: date, gender: binary.refine((value): boolean => value !== null, "Choose a gender"),
  phoneNumber: text.max(50), region: text.max(200), nationality: option, residentialAddress: text.max(150), maritalStatus: binary, religion,
  dateEmployed: date, bankAccountNumber: text.max(20), ssnitNumber: text.max(13), ghanaCardNumber: text.refine((value) => !value || /^GHA-\d{9}-\d$/.test(value), "Use GHA-XXXXXXXXX-X"), staffNumber: text.max(15), email: text.refine((value) => !value || z.email().safeParse(value).success, "Enter a valid email"),
  father: familyMemberSchema, mother: familyMemberSchema, spouse: familyMemberSchema, emergencyContact: contactSchema, nextOfKin: contactSchema,
  children: z.array(childSchema).max(100), siblings: z.array(siblingSchema).max(100), educationBackground: z.array(educationSchema).max(100), employmentHistory: z.array(employmentSchema).max(100),
  photo: z.instanceof(File).nullable().refine((file) => !file || ["image/png", "image/jpeg", "image/webp"].includes(file.type), "Choose a PNG, JPEG or WebP image").refine((file) => !file || file.size <= 5 * 1024 * 1024, "The image must be 5 MB or smaller"),
}).superRefine((values, context) => {
  if (values.dateOfBirth && values.dateOfBirth > new Date()) context.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Birth date cannot be in the future." });
  if (values.dateOfBirth && values.dateEmployed && values.dateEmployed < values.dateOfBirth) context.addIssue({ code: "custom", path: ["dateEmployed"], message: "Employment cannot start before birth." });
});
export type EmployeeValues = z.infer<typeof employeeSchema>;
export const emptyFamily = () => ({ fullName: "", phoneNumber: "", occupation: "", lifeStatus: null });
export const emptyContact = () => ({ fullName: "", contactNumber: "", relationship: "", residentialAddress: "" });
export const emptyEmployee = (): EmployeeValues => ({ firstName: "", lastName: "", dateOfBirth: null, gender: null, phoneNumber: "", region: "", nationality: null, residentialAddress: "", maritalStatus: null, religion: null, dateEmployed: null, bankAccountNumber: "", ssnitNumber: "", ghanaCardNumber: "", staffNumber: "", email: "", father: emptyFamily(), mother: emptyFamily(), spouse: emptyFamily(), emergencyContact: emptyContact(), nextOfKin: emptyContact(), children: [], siblings: [], educationBackground: [], employmentHistory: [], photo: null });
