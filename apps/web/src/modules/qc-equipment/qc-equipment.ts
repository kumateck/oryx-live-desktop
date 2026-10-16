import { z } from "zod";
import { qcApi } from "@/shared/api/generated/qc";
import { addTags } from "@/shared/api/add-tags";

export const qcEquipmentPermissions = { view: "CanViewQcEquipment", add: "CanCreateQcEquipment", edit: "CanEditQcEquipmentDetails", remove: "CanDeleteQcEquipment" } as const;
export const qcEquipmentAudit = { module: "Settings", subModule: "Equipment" } as const;
export const qcEquipmentPath = "/settings/qc-equipments";
/** The server's qualification states. */
export const qualificationLabels = ["Qualified", "Due for calibration", "Overdue", "Out of service"] as const;
export const qualificationLabel = (status: number | null) => status === null ? null : qualificationLabels[status] ?? "Unknown";

const list = { type: "QcEquipment" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];
export const qcEquipmentApi = qcApi.enhanceEndpoints({ endpoints: { getApiV1QcEquipment: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, getApiV1QcEquipmentById: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, postApiV1QcEquipment: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
  putApiV1QcEquipmentById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); }, deleteApiV1QcEquipmentById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); } } });

const text = z.string().nullish().transform((value) => value?.trim() || null);
const status = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).nullish().catch(null);
const equipment = z.object({ id: z.string().nullish(), equipmentId: text, name: text, serialNumber: text, make: text, model: text, createdAt: text, calibrationDueDate: text, lastCalibratedAt: text, calibrationCertificateAttachmentId: text, qualificationStatus: status,
  qcEquipmentCategory: z.object({ id: z.string().nullish(), name: text }).nullish(), createdBy: z.object({ firstName: text, lastName: text }).nullish() });
const read = (row: z.infer<typeof equipment>) => row.id ? [{ id: row.id, equipmentId: row.equipmentId ?? "", name: row.name ?? "Unnamed equipment", serialNumber: row.serialNumber ?? "", make: row.make ?? "", model: row.model ?? "", createdAt: row.createdAt,
  createdBy: [row.createdBy?.firstName, row.createdBy?.lastName].filter(Boolean).join(" ") || null, category: row.qcEquipmentCategory?.id ? { value: row.qcEquipmentCategory.id, label: row.qcEquipmentCategory.name ?? "Unnamed category" } : null,
  calibrationDueDate: row.calibrationDueDate, lastCalibratedAt: row.lastCalibratedAt, certificateId: row.calibrationCertificateAttachmentId, qualification: row.qualificationStatus ?? null }] : [];
export const qcEquipmentRowsSchema = z.array(equipment).nullish().transform((rows) => (rows ?? []).flatMap(read));
export const qcEquipmentSchema = equipment.transform((row) => read(row)[0] ?? null);
export type QcEquipment = z.infer<typeof qcEquipmentRowsSchema>[number];

const required = (what: string) => z.string().trim().min(1, `Enter the ${what}`).max(255, `Keep the ${what} under 255 characters`);
export const qcEquipmentFormSchema = z.object({ equipmentId: required("equipment ID"), serialNumber: required("serial number"), name: required("equipment name"), make: required("make"), model: required("model"),
  category: z.object({ value: z.string().min(1), label: z.string() }).nullable().refine((value): boolean => Boolean(value), "Choose the category") });
export type QcEquipmentFormValues = z.infer<typeof qcEquipmentFormSchema>;

/**
 * The request for a save. Calibration and qualification are kept by the laboratory elsewhere and are not on
 * this form; when equipment is edited they are sent back unchanged so saving a name does not clear them.
 */
export function qcEquipmentBody(values: QcEquipmentFormValues, existing: QcEquipment | null) {
  return { equipmentId: values.equipmentId, name: values.name, serialNumber: values.serialNumber, make: values.make, model: values.model, ...(values.category ? { qcEquipmentCategoryId: values.category.value } : {}),
    ...(existing ? { calibrationDueDate: existing.calibrationDueDate, lastCalibratedAt: existing.lastCalibratedAt, calibrationCertificateAttachmentId: existing.certificateId, ...(existing.qualification === null ? {} : { qualificationStatus: existing.qualification }) } : {}) };
}
