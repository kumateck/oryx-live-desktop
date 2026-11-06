// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { SearchableFilterSelect } from "./searchable-filter-select";

afterEach(cleanup);

it("maps the All choice to undefined and back", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  function Filter() {
    const [value, setValue] = useState<string | undefined>(undefined);
    return <SearchableFilterSelect label="Warehouse" all="All warehouses" value={value}
      options={[{ value: "w1", label: "Main store" }, { value: "w2", label: "Cold room" }]} onChange={(next) => { setValue(next); onChange(next); }} />;
  }
  render(<Filter />);
  const trigger = screen.getByRole("combobox", { name: "Warehouse" });
  expect(trigger.textContent).toBe("All warehouses");
  await user.click(trigger);
  await user.type(screen.getByRole("combobox", { name: "Search Warehouse" }), "cold");
  await user.keyboard("{Enter}");
  expect(onChange).toHaveBeenLastCalledWith("w2");
  await waitFor(() => expect(trigger.textContent).toBe("Cold room"));
  await user.click(trigger);
  await user.click(await screen.findByRole("option", { name: "All warehouses" }));
  expect(onChange).toHaveBeenLastCalledWith(undefined);
  await waitFor(() => expect(trigger.textContent).toBe("All warehouses"));
});
