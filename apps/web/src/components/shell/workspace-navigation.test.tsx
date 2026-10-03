// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TooltipProvider } from "../ui/tooltip";
import { WorkspaceNavigation } from "./workspace-navigation";

beforeEach(() => {
  // jsdom lacks PointerEvent; Radix distinguishes mouse hover from touch.
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    readonly pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? "mouse";
    }
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function openNavigation() {
  const onOpenSidebar = vi.fn();
  render(<MemoryRouter><TooltipProvider>
    <WorkspaceNavigation
      groups={[
        { id: "procurement", label: "Procurement", items: [{ id: "suppliers", label: "Suppliers", path: "/settings/suppliers" }] },
        { id: "quality-control", label: "Quality Control", items: [{ id: "testing", label: "Testing", path: "/quality-control/testing" }] },
      ]}
      active={null} pathname="/home" sidebarOpen onOpenSidebar={onOpenSidebar}
    />
  </TooltipProvider></MemoryRouter>);
  return { user: userEvent.setup(), onOpenSidebar };
}

it("shows the display name on hover in a portal outside the scrolling rail", async () => {
  const { user } = openNavigation();
  const button = screen.getByRole("button", { name: "Quality Control" });
  await user.hover(button);
  const tooltip = await screen.findByRole("tooltip");
  expect(tooltip.textContent).toBe("Quality Control");
  expect(tooltip.closest(".icon-rail")).toBeNull();
  expect(button.getAttribute("title")).toBeNull();
  await user.unhover(button);
  fireEvent.pointerMove(document.body, { pointerType: "mouse", clientX: 500, clientY: 500 });
  await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
});

it("shows names on keyboard focus, dismisses with Escape, and preserves group selection", async () => {
  const { user, onOpenSidebar } = openNavigation();
  await user.tab();
  expect((await screen.findByRole("tooltip")).textContent).toBe("Procurement");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  await user.tab();
  expect((await screen.findByRole("tooltip")).textContent).toBe("Quality Control");
  await user.keyboard("{Enter}");
  expect(onOpenSidebar).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Quality Control" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("complementary", { name: "Quality Control navigation" })).toBeTruthy();
});
