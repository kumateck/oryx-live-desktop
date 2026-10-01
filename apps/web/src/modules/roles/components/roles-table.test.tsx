// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { RolesTable } from "./roles-table";

afterEach(cleanup);

it("paginates role records without hiding their detail action", () => {
  const roles = Array.from({ length: 21 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    name: `Role ${String(index + 1).padStart(2, "0")}`, displayName: `Display ${index + 1}`, type: 0 as const, isManager: false,
  }));
  render(<MemoryRouter><RolesTable roles={roles} /></MemoryRouter>);
  expect(screen.getByText("Display 1")).toBeTruthy();
  expect(screen.queryByText("Display 21")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getByText("Display 21")).toBeTruthy();
  expect(screen.getByRole("link", { name: "View details" }).getAttribute("href")).toBe(`/access-management/roles/${roles[20]?.id}`);
});
