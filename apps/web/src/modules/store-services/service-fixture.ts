import { serviceSchema } from "@/shared/services/contracts";
export const serviceId = "01a152ee-6948-7e40-a0f0-8c01e2a43ea9";
export const fileId = "79e15fc7-4f91-45e3-abbb-330d35956510";
export const reference = "02157256-a433-4895-a50d-ea5d67beb3b9";
export const service = serviceSchema.parse({
  id: serviceId,
  name: "Calibration",
  code: "SVC001",
  startDate: "2026-10-01T15:30:00Z",
  endDate: "2027-10-01T15:30:00Z",
  isActive: true,
  description: "Calibrate instruments",
  attachments: [{ id: fileId, reference, name: "Certificate.pdf", link: `http://example.invalid/api/v1/file/Service/${serviceId}/${reference}` }],
});
