// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import type { SelectLoader, SelectOption } from "./form-wizard-types";
import { SearchableSelect } from "./searchable-select";
import { searchableSelectVisibleLimit } from "./searchable-select-list";

afterEach(cleanup);

const roles: SelectOption[] = [
  { value: "admin", label: "Administrator" },
  { value: "buyer", label: "Buyer" },
  { value: "qa", label: "QA Officer" },
  { value: "qc", label: "QC Analyst" },
];

function Single({ options = roles, onChange, initial = null }: { options?: readonly SelectOption[]; onChange?: (option: SelectOption | null) => void; initial?: SelectOption | null }) {
  const [value, setValue] = useState<SelectOption | null>(initial);
  return <SearchableSelect label="Role" options={options} value={value} onChange={(next) => { setValue(next); onChange?.(next); }} placeholder="Select a role" />;
}

function AsyncSingle({ loadOptions }: { loadOptions: SelectLoader }) {
  const [value, setValue] = useState<SelectOption | null>(null);
  return <SearchableSelect label="Material" loadOptions={loadOptions} debounceMs={0} value={value} onChange={setValue} />;
}

const optionNames = () => screen.getAllByRole("option").map((option) => option.textContent);

it("filters an in-memory list on the device, case-insensitively", async () => {
  const user = userEvent.setup();
  render(<Single />);
  await user.click(screen.getByRole("combobox", { name: "Role" }));
  expect(optionNames()).toEqual(["Administrator", "Buyer", "QA Officer", "QC Analyst"]);
  await user.type(screen.getByRole("combobox", { name: "Search Role" }), "q");
  expect(optionNames()).toEqual(["QA Officer", "QC Analyst"]);
  await user.type(screen.getByRole("combobox", { name: "Search Role" }), "zz");
  expect(screen.queryAllByRole("option")).toHaveLength(0);
  expect(screen.getByText("No records found")).toBeTruthy();
});

it("caps a very long in-memory list and says how many more there are", async () => {
  const user = userEvent.setup();
  const many = Array.from({ length: searchableSelectVisibleLimit + 20 }, (_, index) => ({ value: `m${index}`, label: `Material ${index}` }));
  render(<Single options={many} />);
  await user.click(screen.getByRole("combobox", { name: "Role" }));
  expect(screen.getAllByRole("option")).toHaveLength(searchableSelectVisibleLimit);
  expect(screen.getByText("20 more. Type to narrow the list.")).toBeTruthy();
  await user.type(screen.getByRole("combobox", { name: "Search Role" }), "Material 119");
  expect(optionNames()).toEqual(["Material 119"]);
});

it("picks with the keyboard, closes, and returns focus to the trigger", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Single onChange={onChange} />);
  const trigger = screen.getByRole("combobox", { name: "Role" });
  trigger.focus();
  await user.keyboard("{Enter}");
  const search = await screen.findByRole("combobox", { name: "Search Role" });
  await waitFor(() => expect(document.activeElement).toBe(search));
  await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
  expect(onChange).toHaveBeenLastCalledWith({ value: "qa", label: "QA Officer" });
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  expect(trigger.textContent).toBe("QA Officer");
  await waitFor(() => expect(document.activeElement).toBe(trigger));

  // Reopening marks the choice; Escape closes without changing it and focus goes back.
  await user.keyboard("{Enter}");
  expect((await screen.findByRole("option", { name: "QA Officer" })).getAttribute("aria-checked")).toBe("true");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  expect(document.activeElement).toBe(trigger);
  expect(onChange).toHaveBeenCalledTimes(1);
});

it("clears the choice and keeps focus on the field", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Single onChange={onChange} initial={roles[1] ?? null} />);
  await user.click(screen.getByRole("button", { name: "Clear Role" }));
  expect(onChange).toHaveBeenCalledWith(null);
  const trigger = screen.getByRole("combobox", { name: "Role" });
  expect(trigger.textContent).toBe("Select a role");
  expect(document.activeElement).toBe(trigger);
  expect(screen.queryByRole("button", { name: "Clear Role" })).toBeNull();
});

it("searches and pages a loader, aborting superseded requests and keeping the choice in view", async () => {
  const user = userEvent.setup();
  const pages: Record<number, SelectOption[]> = {
    1: [{ value: "a", label: "RMA001 - Acetic acid" }, { value: "b", label: "RMA002 - Aerosil" }],
    2: [{ value: "c", label: "RMA003 - Alginic acid" }],
  };
  const signals: AbortSignal[] = [];
  const loadOptions = vi.fn<SelectLoader>(async (search, page, signal) => {
    signals.push(signal);
    return { options: (pages[page] ?? []).filter((option) => option.label.toLowerCase().includes(search.toLowerCase())), hasNext: page === 1 && !search, hasPrevious: page > 1 };
  });
  render(<AsyncSingle loadOptions={loadOptions} />);
  const trigger = screen.getByRole("combobox", { name: "Material" });
  await user.click(trigger);
  expect(await screen.findByRole("option", { name: "RMA001 - Acetic acid" })).toBeTruthy();

  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(await screen.findByRole("option", { name: "RMA003 - Alginic acid" })).toBeTruthy();
  expect(loadOptions).toHaveBeenLastCalledWith("", 2, expect.any(AbortSignal));
  expect(document.activeElement).toBe(screen.getByRole("combobox", { name: "Search Material" }));
  await user.click(screen.getByRole("option", { name: "RMA003 - Alginic acid" }));
  await waitFor(() => expect(trigger.textContent).toBe("RMA003 - Alginic acid"));

  // A search starts again at page 1; the choice from page 2 stays pinned at the top.
  await user.click(trigger);
  await user.type(await screen.findByRole("combobox", { name: "Search Material" }), "aer");
  await waitFor(() => expect(loadOptions).toHaveBeenLastCalledWith("aer", 1, expect.any(AbortSignal)));
  expect(await screen.findByRole("option", { name: "RMA002 - Aerosil" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "RMA003 - Alginic acid", description: "Selected" })).toBeTruthy();
  expect(screen.queryByRole("option", { name: "RMA003 - Alginic acid" })).toBeNull();
  // Every request but the last was aborted when a newer one replaced it.
  expect(signals.slice(0, -1).every((signal) => signal.aborted)).toBe(true);

  // Enter picks the highlighted search result.
  await user.keyboard("{Enter}");
  await waitFor(() => expect(trigger.textContent).toBe("RMA002 - Aerosil"));
});

it("shows a load failure with a retry", async () => {
  const user = userEvent.setup();
  let fail = true;
  const loadOptions = vi.fn<SelectLoader>(async () => {
    if (fail) throw new Error("offline");
    return { options: [{ value: "x", label: "Xylitol" }], hasNext: false, hasPrevious: false };
  });
  render(<AsyncSingle loadOptions={loadOptions} />);
  await user.click(screen.getByRole("combobox", { name: "Material" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Could not load options");
  fail = false;
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByRole("option", { name: "Xylitol" })).toBeTruthy();
});

it("shows the loading and error states of an in-memory list", async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  const { rerender } = render(<SearchableSelect label="Role" options={[]} loading value={null} onChange={() => {}} />);
  expect(screen.getByRole("combobox", { name: "Role" }).textContent).toBe("Loading…");
  rerender(<SearchableSelect label="Role" options={[]} error="Roles could not be loaded." onRetry={onRetry} value={null} onChange={() => {}} />);
  await user.click(screen.getByRole("combobox", { name: "Role" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Roles could not be loaded.");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(onRetry).toHaveBeenCalled();
});

it("toggles several options and stays open in multiple mode", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  function Multi() {
    const [value, setValue] = useState<readonly SelectOption[]>([]);
    return <SearchableSelect multiple label="Roles" options={roles} value={value} onChange={(next) => { setValue(next); onChange(next); }} />;
  }
  render(<Multi />);
  await user.click(screen.getByRole("combobox", { name: "Roles" }));
  await user.click(await screen.findByRole("option", { name: "Buyer" }));
  await user.keyboard("{ArrowDown}{Enter}");
  expect(onChange).toHaveBeenLastCalledWith([roles[1], roles[2]]);
  expect(screen.getByRole("listbox", { name: "Roles" })).toBeTruthy();
  await user.click(screen.getByRole("option", { name: "Buyer" }));
  expect(onChange).toHaveBeenLastCalledWith([roles[2]]);
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Clear Roles" }));
  expect(onChange).toHaveBeenLastCalledWith([]);
});
