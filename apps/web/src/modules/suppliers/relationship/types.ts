import type { z } from "zod";
import type { responseSchemas } from "./response-schemas";

/** Response types come from the same runtime schemas used at the HTTP boundary. */
export type Certification = z.infer<typeof responseSchemas.certification>[number];
export type Contact = z.infer<typeof responseSchemas.contact>[number];
export type BankDetail = z.infer<typeof responseSchemas.bank>[number];
export type PricingAgreement = z.infer<typeof responseSchemas.pricing>[number];
export type Performance = z.infer<typeof responseSchemas.performanceRecord>;
export type SpendSummary = z.infer<typeof responseSchemas.spend>;
export type ComplianceDue = z.infer<typeof responseSchemas.complianceDue>[number];

export interface CertificationRequest {
  certificationType: Certification["certificationType"]; certificateNumber: string; issuingBody: string;
  issueDate: string; expiryDate: string;
}
export interface ContactRequest { name: string; role: string; email: string; phone: string; isPrimary: boolean }
export interface BankRequest {
  bankName: string; accountNumber: string; accountName: string; swiftCode: string; iban: string;
  branchAddress: string; currencyId: string;
}
export interface PricingRequest {
  materialId: string; uoMId: string; agreedPrice: number; priceUoM: string; currencyId: string;
  effectiveFrom: string; effectiveTo?: string | null; notes?: string | null;
}
export interface PerformanceRequest {
  periodStart: string; periodEnd: string; onTimeDeliveryWeight: number; qualityWeight: number;
}
export interface Scoped<T> { supplierId: string; body: T }
export interface ScopedRecord<T> extends Scoped<T> { id: string }
export interface RecordId { supplierId: string; id: string }
