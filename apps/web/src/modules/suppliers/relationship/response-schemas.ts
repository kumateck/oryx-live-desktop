import { z } from "zod";

const certificationType = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const pricingState = z.union([z.literal(0), z.literal(1), z.literal(2)]);
const currency = z.object({ id: z.string(), name: z.string(), symbol: z.string().nullish() });
const attachment = z.object({
  id: z.string().optional(), name: z.string().nullish(), link: z.string().nullish(), reference: z.string().nullish(),
});
const certification = z.object({
  id: z.string(), supplierId: z.string(), supplierName: z.string().nullish(),
  certificationType, certificateNumber: z.string(), issuingBody: z.string(),
  issueDate: z.string(), expiryDate: z.string(), attachments: z.array(attachment),
});
const contact = z.object({
  id: z.string(), supplierId: z.string(), name: z.string(),
  role: z.string().nullish(), email: z.string().nullish(), phone: z.string().nullish(), isPrimary: z.boolean(),
});
const bank = z.object({
  id: z.string(), supplierId: z.string(), bankName: z.string(), accountNumber: z.string(), accountName: z.string(),
  swiftCode: z.string().nullish(), iban: z.string().nullish(), branchAddress: z.string().nullish(), currency,
});
const pricing = z.object({
  id: z.string(), supplierId: z.string(), status: pricingState, changeKind: pricingState,
  replacesAgreementId: z.string().nullish(), priorAgreedPrice: z.number().nullish(),
  priorPriceUoM: z.string().nullish(), priorCurrencySymbol: z.string().nullish(),
  materialId: z.string(), materialName: z.string(), uoMId: z.string(), uoMName: z.string(),
  agreedPrice: z.number(), priceUoM: z.string(), currency,
  effectiveFrom: z.string(), effectiveTo: z.string().nullish(), notes: z.string().nullish(),
});
const performance = z.object({
  id: z.string().optional(), supplierId: z.string(), periodStart: z.string(), periodEnd: z.string(),
  evaluatedDeliveries: z.number(), onTimeDeliveries: z.number(), evaluatedBatches: z.number(),
  rejectedBatches: z.number(), onTimeDeliveryRate: z.number(), qualityRejectRate: z.number(),
  score: z.number(), dataQualityWarnings: z.array(z.string()),
});
const spend = z.object({
  supplierId: z.string(), from: z.string(), to: z.string(), baseCurrencyId: z.string().nullish(),
  baseCurrencyName: z.string().nullish(), totalBase: z.number(),
  months: z.array(z.object({
    month: z.string(), totalBase: z.number(),
    originalCurrencies: z.array(z.object({ currencyId: z.string(), currencyName: z.string(), amount: z.number() })),
  })), dataQualityWarnings: z.array(z.string()),
});
const complianceDue = z.object({
  supplierId: z.string(), supplierName: z.string(), dueDate: z.string(), daysUntilDue: z.number(),
});

export const responseSchemas = {
  certification: z.array(certification), contact: z.array(contact), bank: z.array(bank), pricing: z.array(pricing),
  performance: z.array(performance), performanceRecord: performance, spend, complianceDue: z.array(complianceDue),
  createdId: z.string(),
};
