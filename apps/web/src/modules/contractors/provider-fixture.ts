import { providerSchema } from "./schemas/provider";
export const id = "01a152ee-6948-7e40-a0f0-8c01e2a43ea9";
export const firstService = "79e15fc7-4f91-45e3-abbb-330d35956510";
export const secondService = "02157256-a433-4895-a50d-ea5d67beb3b9";
export const provider = providerSchema.parse({
  id,
  name: "Contractor",
  address: "Address",
  phone: "+44 1234 567890",
  email: "contractor@example.com",
  country: { id, name: "Country" },
  currency: { id, name: "Currency" },
  services: [
    { id: firstService, name: "Service A", code: "A", startDate: "2026-01-01T00:00:00Z", endDate: "2027-01-01T00:00:00Z", isActive: true, attachments: [] },
  ],
});
