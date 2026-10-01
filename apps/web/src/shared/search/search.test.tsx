// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { AnimatedSearch } from "../../components/shell/animated-search";
import { PageSearchProvider, usePageSearch } from "./page-search";
import { isSearchShortcut, normalizeSearchTerm, withSearchTerm } from "./search-term";

afterEach(() => { cleanup(); vi.useRealTimers(); });

const groups = [{ id: "it", label: "IT Support", items: [{ id: "it.users", label: "Users", path: "/access-management/users" }] }];

function Records({ busy = false }: { busy?: boolean }) {
  const term = usePageSearch("users", busy);
  const location = useLocation();
  return <p data-testid="page">{term}|{location.search}</p>;
}

function open(address: string, page: React.ReactNode) {
  render(<MemoryRouter initialEntries={[address]}><PageSearchProvider><AnimatedSearch groups={groups} />{page}</PageSearchProvider></MemoryRouter>);
}
const page = () => screen.getByTestId("page").textContent;

it("normalises terms and keeps other address parameters", () => {
  expect(normalizeSearchTerm("  ada   mensah ")).toBe("ada mensah");
  expect(withSearchTerm(new URLSearchParams("status=1"), " ada ").toString()).toBe("status=1&q=ada");
  expect(withSearchTerm(new URLSearchParams("status=1&q=ada"), "  ").toString()).toBe("status=1");
});

it("recognises the search shortcuts without stealing a slash typed into a field", () => {
  const key = (k: string, extra = {}) => ({ key: k, ctrlKey: false, metaKey: false, altKey: false, ...extra });
  expect(isSearchShortcut(key("k", { ctrlKey: true }), true)).toBe(true);
  expect(isSearchShortcut(key("K", { metaKey: true }), false)).toBe(true);
  expect(isSearchShortcut(key("/"), false)).toBe(true);
  expect(isSearchShortcut(key("/"), true)).toBe(false);
  expect(isSearchShortcut(key("k"), false)).toBe(false);
});

it("filters the open page through the address once typing pauses, keeping other parameters", async () => {
  open("/access-management/users?status=1", <Records />);
  const box = await screen.findByRole("searchbox", { name: "Search users" });
  fireEvent.click(screen.getByRole("button", { name: "Open search" }));
  fireEvent.change(box, { target: { value: "  ada " } });
  expect(page()).toBe("|?status=1");
  await waitFor(() => expect(page()).toBe("ada|?status=1&q=ada"));
  fireEvent.keyDown(box, { key: "Escape" });
  await waitFor(() => expect(page()).toBe("|?status=1"));
});

it("restores a search from the address and shows when the page is busy", async () => {
  open("/access-management/users?q=mensah", <Records busy />);
  expect(page()).toBe("mensah|?q=mensah");
  expect((await screen.findByRole("searchbox", { name: "Search users" }) as HTMLInputElement).value).toBe("mensah");
  expect(screen.getByRole("status", { name: "Searching" })).toBeTruthy();
});

it("offers pages to open and leaves the address alone on a page with nothing to search", async () => {
  function Plain() { return <p data-testid="page">|{useLocation().search}</p>; }
  open("/home", <Plain />);
  fireEvent.click(screen.getByRole("button", { name: "Open search" }));
  fireEvent.change(screen.getByRole("searchbox", { name: "Search pages" }), { target: { value: "user" } });
  expect(screen.getByRole("link", { name: /Users/ }).getAttribute("href")).toBe("/access-management/users");
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 400)); });
  expect(page()).toBe("|");
});

it("focuses the search from the keyboard", async () => {
  open("/access-management/users", <Records />);
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("searchbox", { name: "Search users" })));
});
