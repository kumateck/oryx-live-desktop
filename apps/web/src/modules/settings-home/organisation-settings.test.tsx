// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import CodeSettingsRoute from "../../pages/(workspace)/settings/code-settings/page";
import DepartmentsRoute from "../../pages/(workspace)/settings/departments/page";
import EquipmentDetailRoute from "../../pages/(workspace)/settings/equipments/[id]/details/page";
import EquipmentRoute from "../../pages/(workspace)/settings/equipments/page";
import HolidaysRoute from "../../pages/(workspace)/settings/holidays/page";
import SettingsHomeRoute from "../../pages/(workspace)/settings/page";
import QcEquipmentRoute from "../../pages/(workspace)/settings/qc-equipments/page";
import UnitsRoute from "../../pages/(workspace)/settings/uom/page";
import WorkingDaysRoute from "../../pages/(workspace)/settings/working-days/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { openMenu } from "../../test/menu";
import { codeDefaults, exampleCode, freeModelTypes, spaced } from "../code-settings/code-settings";
import { codePrefix, parentChoices } from "../departments/departments";
import { capacityText, equipmentBody, equipmentFormSchema } from "../equipment/equipment";
import { dayFromServer, dayToServer, holidayRowsSchema } from "../holidays/holidays";
import { qcEquipmentBody } from "../qc-equipment/qc-equipment";
import { unitDefaults } from "../units-of-measure/units";
import { weekBody, weekOf, weekProblems } from "../working-days/working-days";
import { settingsSections } from "./settings-home";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

it("applies the rules of the settings records", () => {
  expect([codePrefix("DP-", " tablet "), codePrefix(null, "syrup")]).toEqual(["DP-T", "S"]);
  expect(parentChoices([{ id: "a", name: "A" }, { id: "b", name: "B" }] as never, "a")).toEqual([{ value: "b", label: "B" }]);
  // A holiday is a calendar day: it survives the trip to the server and back in any time zone.
  expect(dayToServer(new Date(2026, 11, 25))).toBe("2026-12-25T00:00:00.000Z");
  expect(dayFromServer("2026-12-25T00:00:00Z")?.getDate()).toBe(25);
  expect(holidayRowsSchema.parse({ data: [{ id: "2", name: "B", date: "2026-12-26" }, { id: "1", name: "A", date: "2026-01-01" }] }).map((row) => row.id)).toEqual(["1", "2"]);
  // The category of a unit is its own, not a copy of its type.
  expect(unitDefaults({ id: "u", name: "Kilogram", symbol: "kg", description: null, isScalable: true, type: 0, category: 2 }).category).toEqual({ value: "2", label: "Countable" });
  const week = weekOf([{ day: 1, isWorkingDay: true, startTime: "8:00 AM", endTime: "5:00 PM" }]);
  expect(weekBody(week)).toEqual([{ day: 1, isWorkingDay: true, startTime: "8:00 AM", endTime: "5:00 PM" }]);
  expect(weekProblems({ days: week.days.map((day) => ({ ...day, on: false })) })).toEqual({ week: "Choose at least one working day." });
  expect(weekProblems({ days: week.days.map((day) => day.day === 1 ? { ...day, endTime: "7:00 AM" } : day.day === 2 ? { ...day, on: true } : day) })).toEqual({ 1: "The end time must be after the start time.", 2: "Set the start and end time." });
  expect([spaced("GrnNumber"), spaced("MaterialSTPNumber"), exampleCode({ prefix: "PO-", namingType: 0, minimum: 4, maximum: 8 })]).toEqual(["Grn Number", "Material STP Number", "PO-0001"]);
  expect(freeModelTypes([{ id: "1", modelType: "product", prefix: "P", namingType: 0, minimum: 1, maximum: 3 }], null).some((item) => item.value === "Product")).toBe(false);
  expect(codeDefaults({ id: "1", modelType: "grnNumber", prefix: "G", namingType: 2, minimum: 1, maximum: 3 }).modelType).toEqual({ value: "GrnNumber", label: "Grn Number" });
});

it("requires a capacity and unit for storage equipment and keeps calibration when QC equipment is edited", () => {
  const base = { number: "EQ-1", name: "Tank", model: "", serialNumber: "", location: "Bay 2", isStorage: "1", relevant: "0", capacity: null, unit: null, department: { value: "d1", label: "Syrup" } };
  expect(equipmentFormSchema.safeParse(base).error?.issues.map((issue) => issue.path[0])).toEqual(["capacity", "unit"]);
  expect(equipmentFormSchema.safeParse({ ...base, isStorage: "0" }).success).toBe(true);
  // The storage location typed on the form is what is saved.
  expect(equipmentBody({ ...base, capacity: 500, unit: { value: "u1", label: "L" } })).toMatchObject({ location: "Bay 2", isStorage: true, relevanceCheck: false, capacityQuantity: 500, uoMId: "u1", departmentId: "d1" });
  expect([capacityText({ capacity: 2_000_000, unit: { value: "u", label: "mg" } }), capacityText({ capacity: 0, unit: null })]).toEqual(["2 kg", null]);
  const values = { equipmentId: "Q-1", serialNumber: "S", name: "HPLC", make: "Agilent", model: "1260", category: { value: "c1", label: "Chromatography" } };
  const existing = { calibrationDueDate: "2027-01-01T00:00:00Z", lastCalibratedAt: "2026-01-01T00:00:00Z", certificateId: "att-1", qualification: 1 as const };
  expect(qcEquipmentBody(values, existing as never)).toMatchObject({ calibrationDueDate: "2027-01-01T00:00:00Z", lastCalibratedAt: "2026-01-01T00:00:00Z", calibrationCertificateAttachmentId: "att-1", qualificationStatus: 1, qcEquipmentCategoryId: "c1" });
  expect(qcEquipmentBody(values, null)).not.toHaveProperty("calibrationDueDate");
});

it("lists only the settings pages a user may open", () => {
  const manifests = [{ id: "departments", label: "Departments", root: "/settings/departments", order: 1, access: { kind: "authenticated" } }, { id: "uom", label: "Units", root: "/settings/uom", order: 2, access: { kind: "authenticated" } },
    { id: "extra", label: "Extra", root: "/settings/extra", order: 3, access: { kind: "authenticated" } }, { id: "home", label: "Home", root: "/home", order: 4, access: { kind: "authenticated" } }] as never[];
  const sections = settingsSections(manifests, (manifest) => manifest.id !== "uom");
  expect(sections.map((section) => [section.title, section.pages.map((page) => page.id)])).toEqual([["General settings", ["extra"]], ["Organisation", ["departments"]]]);
});

const page = (data: unknown[]) => Response.json({ data, pageIndex: 1, pageCount: 1, totalRecordCount: data.length });
const departments = [{ id: "d1", code: "DP-T1", name: "Tablet", type: 0, division: 1, description: "<p>Solid dose</p>" }, { id: "d2", code: "DP-Q1", name: "QC Lab", type: 1, parentDepartment: { id: "d1", name: "Tablet" } }];
interface Call { method: string; path: string; body: unknown }
function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    const text = input.method === "GET" || input.method === "DELETE" ? "" : await input.clone().text();
    calls.push({ method: input.method, path, body: text ? JSON.parse(text) as unknown : null });
    if (path === "/api/v1/department") return input.method === "GET" ? page(departments) : Response.json("d9", { status: 201 });
    if (path === "/api/v1/collection/uom/paginated") return page([{ id: "u1", name: "Litre", symbol: "L", type: 0, category: 1, isScalable: true }]);
    if (path === "/api/v1/collection") return Response.json({ QcEquipmentCategory: [{ id: "c1", name: "Chromatography" }] });
    if (path === "/api/v1/holidays") return input.method === "GET" ? Response.json([{ id: "h1", name: "Christmas", date: "2026-12-25T00:00:00Z" }]) : Response.json("h9", { status: 201 });
    if (path === "/api/v1/working-days") return input.method === "GET" ? page([{ day: 1, isWorkingDay: true, startTime: "8:00 AM", endTime: "5:00 PM" }]) : new Response(null, { status: 204 });
    if (path === "/api/v1/product/equipment") return page([{ id: "e1", name: "Mixing tank", equipmentNumber: "EQ-1", isStorage: true, capacityQuantity: 500, uoM: { id: "u1", symbol: "L" }, relevanceCheck: true, department: { id: "d1", name: "Tablet" }, location: "Bay 2" }]);
    if (path === "/api/v1/product/equipment/e1") return Response.json({ id: "e1", name: "Mixing tank", equipmentNumber: "EQ-1", isStorage: true, capacityQuantity: 500, uoM: { id: "u1", symbol: "L" }, createdAt: "2026-03-01T00:00:00Z", createdBy: { firstName: "Ama", lastName: "Owusu" } });
    if (path === "/api/v1/qc-equipment") return page([{ id: "q1", equipmentId: "Q-1", name: "HPLC", serialNumber: "SN-9", make: "Agilent", model: "1260", qcEquipmentCategory: { id: "c1", name: "Chromatography" }, calibrationDueDate: "2027-01-01T00:00:00Z", qualificationStatus: 1 }]);
    if (path === "/api/v1/configuration") return input.method === "GET" ? page([{ id: "k1", modelType: "Product", prefix: "PRD-", namingType: 0, minimumNameLength: 4, maximumNameLength: 8 }]) : Response.json("k9", { status: 201 });
    if (path.startsWith("/api/v1/configuration/by-model-type")) return new Response(null, { status: 404 });
    return new Response(null, { status: 204 });
  });
  const router = createMemoryRouter([{ path: "/settings", element: <SettingsHomeRoute /> }, { path: "/settings/departments", element: <DepartmentsRoute /> }, { path: "/settings/uom", element: <UnitsRoute /> }, { path: "/settings/holidays", element: <HolidaysRoute /> },
    { path: "/settings/working-days", element: <WorkingDaysRoute /> }, { path: "/settings/equipments", element: <EquipmentRoute /> }, { path: "/settings/equipments/:id/details", element: <EquipmentDetailRoute /> }, { path: "/settings/qc-equipments", element: <QcEquipmentRoute /> },
    { path: "/settings/code-settings", element: <CodeSettingsRoute /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET" && !call.path.endsWith("/paginated") && call.path !== "/api/v1/collection");

it("edits a department without letting its code change, keeps its division, and never offers it as its own parent", async () => {
  const user = userEvent.setup();
  const { calls } = open("/settings/departments", ["CanViewDepartments", "CanEditDepartment"]);
  expect(await screen.findByText("DP-T1")).toBeTruthy();
  // Without the permission there is no Add button and no Delete action.
  expect(screen.queryByRole("button", { name: "Add department" })).toBeNull();
  await openMenu("Actions for Tablet");
  expect(screen.queryByRole("menuitem", { name: "Delete" })).toBeNull();
  fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
  const dialog = await screen.findByRole("dialog");
  const code = await within(dialog).findByRole("textbox", { name: /Department code/ });
  expect((code as HTMLInputElement).readOnly).toBe(true);
  const name = within(dialog).getByRole("textbox", { name: /^Name/ });
  await user.clear(name); await user.type(name, "Tablets");
  await user.click(within(dialog).getByRole("button", { name: "Save department" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]).toMatchObject({ method: "PUT", path: "/api/v1/department/d1", body: { code: "DP-T1", name: "Tablets", type: 0, division: 1, parentDepartmentId: null } });
});

it("adds a holiday on the chosen calendar day and saves the working week only when it is complete", async () => {
  const user = userEvent.setup();
  const first = open("/settings/holidays", ["CanViewHolidays", "CanCreateHoliday"]);
  expect(await screen.findByText("Christmas")).toBeTruthy();
  expect(screen.getByText(/25 Dec 2026/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Add holiday" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Add holiday" }));
  expect(await within(dialog).findByText("Enter the holiday name")).toBeTruthy();
  expect(await within(dialog).findByText(/Choose the date|Invalid input/)).toBeTruthy();
  expect(writes(first.calls)).toHaveLength(0);
  cleanup(); forgetSession();

  const { calls } = open("/settings/working-days", ["CanViewWorkingDays", "CanCreateWorkingDays", "CanResetWorkingDays"]);
  const monday = await screen.findByRole("button", { name: "Monday", pressed: true });
  expect(screen.getByRole("button", { name: "Save working days" }).hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("button", { name: "Tuesday" }));
  await user.click(screen.getByRole("button", { name: "Save working days" }));
  expect(await screen.findByText("Set the start and end time.")).toBeTruthy();
  expect(writes(calls)).toHaveLength(0);
  // Back to what the server holds.
  await user.click(screen.getByRole("button", { name: "Reset to saved" }));
  expect(screen.getByRole("button", { name: "Tuesday" }).getAttribute("aria-pressed")).toBe("false");
  await user.click(monday); await user.click(screen.getByRole("button", { name: "Save working days" }));
  expect(await screen.findByText("Choose at least one working day.")).toBeTruthy();
  expect(writes(calls)).toHaveLength(0);
});

it("shows the working days read-only to someone who may not change them", async () => {
  open("/settings/working-days", ["CanViewWorkingDays"]);
  expect(await screen.findByText("You can view the working days but not change them.")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Save working days" })).toBeNull();
});

it("lists units, equipment, QC equipment and code rules, and opens an equipment record", async () => {
  open("/settings/uom", ["CanViewUnitOfMeasure"]);
  expect(await screen.findByText("Litre")).toBeTruthy();
  expect(screen.getByText("Volume")).toBeTruthy();
  cleanup(); forgetSession();
  open("/settings/qc-equipments", ["CanViewQcEquipment"]);
  expect(await screen.findByRole("link", { name: "HPLC" })).toBeTruthy();
  expect(screen.getByText("Chromatography")).toBeTruthy();
  cleanup(); forgetSession();
  open("/settings/code-settings", ["CanViewCodeSettings"]);
  expect(await screen.findByText("PRD-0001")).toBeTruthy();
  expect(screen.getByText("Series")).toBeTruthy();
  cleanup(); forgetSession();
  open("/settings/equipments", ["CanViewEquipment"]);
  const link = await screen.findByRole("link", { name: "Mixing tank" });
  expect(screen.getByText("500 L")).toBeTruthy();
  await userEvent.click(link);
  expect(await screen.findByRole("heading", { name: "Mixing tank" })).toBeTruthy();
  expect(screen.getByText("Ama Owusu")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
});
