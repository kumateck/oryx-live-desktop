// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { PermissionPicker } from "./permission-picker";
import { TooltipProvider } from "@/components/ui/tooltip";
import { permissionFixture } from "../lib/permission-fixtures";

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub;
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(cleanup);

function Picker({ disabled = false }: { disabled?: boolean }) {
  const [modules, setModules] = useState(permissionFixture);
  return <TooltipProvider><PermissionPicker modules={modules} onChange={setModules} disabled={disabled} /></TooltipProvider>;
}

it("shows one submodule at a time, with its count, and keeps edits when moving between them", async () => {
  render(<Picker />);
  expect(screen.queryByRole("button", { name: "Enable shown" })).toBeNull();
  expect(screen.queryByRole("tab", { name: "All submodules" })).toBeNull();
  expect(screen.queryByRole("switch", { name: "Create orders" })).toBeNull();
  fireEvent.click(screen.getByRole("switch", { name: "Edit suppliers" }));
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Orders, 0 of 1 enabled" }));
  expect(screen.getByRole("switch", { name: "Create orders" }).getAttribute("aria-checked")).toBe("false");
  await user.click(screen.getByRole("tab", { name: "Suppliers, 2 of 2 enabled" }));
  expect(screen.getByRole("switch", { name: "Edit suppliers" }).getAttribute("aria-checked")).toBe("true");
});

it("the module switch removes all access, then enables all actions", async () => {
  render(<Picker />);
  fireEvent.click(screen.getByRole("switch", { name: "Procurement module access" }));
  expect(screen.getByRole("switch", { name: "View suppliers" }).getAttribute("aria-checked")).toBe("false");
  fireEvent.click(screen.getByRole("switch", { name: "Procurement module access" }));
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Orders, 1 of 1 enabled" }));
  expect(screen.getByRole("switch", { name: "Create orders" }).getAttribute("aria-checked")).toBe("true");
});

it("view-only permission switches cannot change assignments", () => {
  render(<Picker disabled />);
  expect(screen.getByRole("switch", { name: "Procurement module access" }).hasAttribute("disabled")).toBe(true);
  expect(screen.getByRole("switch", { name: "View suppliers" }).hasAttribute("disabled")).toBe(true);
});

it("keeps the active module styling and edits when browsing other modules", async () => {
  render(<Picker />);
  expect(screen.getByRole("tab", { name: "Procurement" }).getAttribute("data-state")).toBe("active");
  fireEvent.click(screen.getByRole("switch", { name: "Edit suppliers" }));
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Finance" }));
  expect(screen.queryByRole("switch", { name: "Edit suppliers" })).toBeNull();
  await user.click(screen.getByRole("tab", { name: "Procurement" }));
  expect(screen.getByRole("switch", { name: "Edit suppliers" }).getAttribute("aria-checked")).toBe("true");
});

it("names modules in full, and finds a permission in any module with the place it lives", async () => {
  render(<Picker />);
  // The tab shows a short code; its full name is what is read out and shown on hover.
  expect(screen.getByRole("tab", { name: "Finance" }).textContent).toBe("FI");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "invoices" } });
  // Procurement is open, yet the Finance permission is found and can be switched from here.
  const found = await screen.findByRole("switch", { name: "Pay invoices" });
  expect(screen.getByText("Finance")).toBeTruthy();
  expect(screen.getByRole("status").textContent).toBe("1 shown across all modules");
  fireEvent.click(found);
  expect(screen.getByRole("switch", { name: "Pay invoices" }).getAttribute("aria-checked")).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(await screen.findByRole("switch", { name: "View suppliers" })).toBeTruthy();
});
