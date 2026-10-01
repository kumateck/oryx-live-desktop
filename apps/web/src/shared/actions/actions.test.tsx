// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Pencil, Trash2 } from "lucide-react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { SessionProvider } from "../auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { chooseAction, openMenu } from "../../test/menu";
import type { ActionEntry } from "./action-items";
import { DropdownButton } from "./dropdown-button";
import { TableMenu } from "./table-menu";

afterEach(() => { cleanup(); forgetSession(); });

async function show(permissions: string[], ui: React.ReactNode) {
  stubBackend({ permissions });
  rememberSession();
  render(<SessionProvider><MemoryRouter>{ui}</MemoryRouter></SessionProvider>);
  // Permissions arrive with the session; wait for it before looking for actions.
  await screen.findByTestId("ready");
}
const ready = <span data-testid="ready" />;

it("shows a row only the actions the user holds, and runs the chosen one", async () => {
  const edit = vi.fn(); const remove = vi.fn(); const rowClick = vi.fn();
  const items: ActionEntry[] = [
    { id: "edit", label: "Edit", icon: Pencil, require: "CanEdit", onSelect: edit },
    { id: "remove", label: "Remove", icon: Trash2, destructive: true, require: "CanDelete", onSelect: remove },
    false,
    { id: "open", label: "Open record", to: "/records/7" },
  ];
  await show(["CanEdit"], <div onClick={rowClick}>{ready}<TableMenu label="Actions for Sugar" items={items} /></div>);
  await openMenu("Actions for Sugar");
  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Edit", "Open record"]);
  // A page action is a real link.
  expect(screen.getByRole("menuitem", { name: "Open record" }).getAttribute("href")).toBe("/records/7");
  fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
  expect(edit).toHaveBeenCalledOnce();
  expect(remove).not.toHaveBeenCalled();
  // Using the menu does not count as clicking the row.
  expect(rowClick).not.toHaveBeenCalled();
});

it("renders nothing when the user holds none of the actions", async () => {
  await show([], <>{ready}<TableMenu label="Actions for Sugar" items={[{ id: "edit", label: "Edit", require: "CanEdit", onSelect: () => undefined }]} />
    <DropdownButton label="Add" items={[{ id: "a", label: "Bulk", require: { kind: "some", permissions: ["CanCreate", "CanEdit"] }, onSelect: () => undefined }, null]} /></>);
  expect(screen.queryByRole("button")).toBeNull();
});

it("offers a button's choices, and explains one that cannot be chosen", async () => {
  const add = vi.fn();
  await show([], <>{ready}<DropdownButton label="Add record" items={[
    { id: "bulk", label: "Bulk", onSelect: () => add("bulk") },
    { id: "finished", label: "Finished", disabled: true, disabledReason: "Needs a finished specification", onSelect: () => add("finished") },
  ]} /></>);
  await openMenu("Add record");
  const blocked = screen.getByRole("menuitem", { name: /Finished/ });
  expect(blocked.getAttribute("aria-disabled")).toBe("true");
  expect(blocked.textContent).toContain("Needs a finished specification");
  fireEvent.click(blocked);
  fireEvent.click(screen.getByRole("menuitem", { name: "Bulk" }));
  expect(add.mock.calls).toEqual([["bulk"]]);
  cleanup();
});

it("is reachable through the test helper in one step", async () => {
  const remove = vi.fn();
  await show([], <>{ready}<TableMenu label="Actions for Sugar" items={[{ id: "remove", label: "Remove", onSelect: remove }]} /></>);
  await chooseAction("Actions for Sugar", "Remove");
  expect(remove).toHaveBeenCalledOnce();
});
