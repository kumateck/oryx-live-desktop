import { z } from "zod";
import { invoiceSchema } from "@/modules/shipment-invoices/schemas/invoice-schema";
import { shipmentFileLimit, shipmentFileTypes, type ShipmentStatus } from "../lib/shipment-kinds";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const status = z.number().nullish().transform((value): ShipmentStatus => value === 1 || value === 2 || value === 3 || value === 4 ? value : 0);

const shipment = z.object({
  id: z.string().nullish(), code: text, status, type: z.number().nullish(), createdAt: z.string().nullish(), atPortAt: z.string().nullish(), clearedAt: z.string().nullish(), transitStartedAt: z.string().nullish(), arrivedAt: z.string().nullish(),
  completedDistributionAt: z.string().nullish(), hasBillingSheet: z.boolean().nullish(), hasApprovedBillingSheet: z.boolean().nullish(), approved: z.boolean().nullish(),
  attachments: z.array(z.object({ id: z.string().nullish(), name: text, link: text })).nullish(), shipmentInvoice: z.unknown(),
  createdBy: z.object({ firstName: text, lastName: text, department: z.object({ name: text }).nullish() }).nullish(),
});

function read(entry: z.infer<typeof shipment>) {
  if (!entry.id) return null;
  const invoice = invoiceSchema.safeParse(entry.shipmentInvoice ?? null);
  return { id: entry.id, code: entry.code ?? "No number", status: entry.status, invoice: invoice.success ? invoice.data : null,
    // 0 is a shipment document (foreign), 1 a waybill (local).
    kind: entry.type === 1 ? "waybill" as const : "shipment" as const,
    createdAt: entry.createdAt ?? null, preparedBy: [entry.createdBy?.firstName, entry.createdBy?.lastName].filter(Boolean).join(" ") || null, preparedByDepartment: entry.createdBy?.department?.name ?? null,
    // When each stage was reached, by the server's status number.
    reached: { 0: entry.createdAt ?? null, 1: entry.atPortAt ?? null, 2: entry.clearedAt ?? null, 3: entry.transitStartedAt ?? null, 4: entry.arrivedAt ?? null } satisfies Record<ShipmentStatus, string | null>,
    distributedAt: entry.completedDistributionAt ?? null, hasBillingSheet: entry.hasBillingSheet === true, billingSheetApproved: entry.hasApprovedBillingSheet === true, approved: entry.approved === true,
    attachments: (entry.attachments ?? []).map((file, index) => ({ id: file.id ?? `file-${index}`, name: file.name ?? "Unnamed file", link: file.link })) };
}

/** A delivery on its way: the invoice it carries and how far it has got. */
export const shipmentSchema = shipment.transform(read);
export const shipmentRowsSchema = z.array(shipment).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type Shipment = z.infer<typeof shipmentRowsSchema>[number];

const option = z.object({ value: z.string().min(1), label: z.string() });
const extensions = shipmentFileTypes.split(",");
export const shipmentFormSchema = z.object({
  code: z.string().trim().min(1, "Enter the document number").max(100, "Keep the number under 100 characters"),
  // Empty until chosen; checked on the field so its message shows with the others.
  invoice: option.nullable().refine((value): boolean => Boolean(value), "Choose the invoice the delivery is for"),
  attachments: z.array(z.instanceof(File)).min(1, "Attach the shipping documents")
    .refine((files) => files.every((file) => extensions.some((extension) => file.name.toLowerCase().endsWith(extension))), "Attach PDF, image, Word or Excel files only")
    .refine((files) => files.every((file) => file.size <= shipmentFileLimit), "Each file must be 10 MB or smaller"),
});
export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;
