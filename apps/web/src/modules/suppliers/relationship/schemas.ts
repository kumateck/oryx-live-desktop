import { z } from "zod";

const option = z.object({ value: z.string().min(1), label: z.string().min(1) });
const selected = option.nullable().superRefine((value, context) => {
  if (!value) context.addIssue({ code: "custom", message: "Choose an option" });
});

export const certificationSchema = z.object({
  certificationType: selected, certificateNumber: z.string().trim().min(1, "Certificate number is required").max(255),
  issuingBody: z.string().trim().min(1, "Issuing body is required").max(255),
  issueDate: z.date(), expiryDate: z.date().nullable(),
}).refine((value) => value.expiryDate !== null, { path: ["expiryDate"], message: "Select an expiry date" })
  .refine((value) => !value.expiryDate || value.expiryDate > value.issueDate, { path: ["expiryDate"], message: "Expiry must be after issue date" });
export type CertificationValues = z.infer<typeof certificationSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255), role: z.string().max(100),
  email: z.union([z.email("Enter a valid email"), z.literal("")]), phone: z.string().max(50), isPrimary: z.boolean(),
});
export type ContactValues = z.infer<typeof contactSchema>;

export const bankSchema = z.object({
  bankName: z.string().trim().min(1, "Bank is required").max(255),
  accountNumber: z.string().trim().min(1, "Account number is required").max(255),
  accountName: z.string().trim().min(1, "Account name is required").max(255),
  swiftCode: z.string().max(100), iban: z.string().max(100), branchAddress: z.string().max(1000), currency: selected,
});
export type BankValues = z.infer<typeof bankSchema>;

export const performanceSchema = z.object({
  periodStart: z.date(), periodEnd: z.date(), deliveryWeight: z.number().min(0).max(1),
}).refine((value) => value.periodEnd >= value.periodStart, { path: ["periodEnd"], message: "End date must follow start date" });
export type PerformanceValues = z.infer<typeof performanceSchema>;

export const pricingSchema = z.object({
  material: selected, currency: selected, agreedPrice: z.number().positive("Price must be above zero"),
  priceUoM: selected,
  effectiveFrom: z.date(), effectiveTo: z.date().nullable(), notes: z.string().max(2000),
}).refine((value) => !value.effectiveTo || value.effectiveTo >= value.effectiveFrom,
  { path: ["effectiveTo"], message: "End date must follow start date" });
export type PricingValues = z.infer<typeof pricingSchema>;
