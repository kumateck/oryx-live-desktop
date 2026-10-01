// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DateRange } from "react-day-picker";
import { afterEach, expect, it } from "vitest";
import { DatePicker } from "./date-picker";
import { DateRangePicker } from "./date-range-picker";
import { MonthYearPicker } from "./month-year-picker";

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

function SingleExample() {
  const [value, setValue] = useState<Date | null>(new Date(2026, 4, 12));
  return <><DatePicker id="production-date" label="Production date" value={value} onChange={setValue} />
    <output>{value ? `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()}` : "empty"}</output></>;
}

it("selects a full date and closes the calendar", async () => {
  const user = userEvent.setup();
  render(<SingleExample />);
  await user.click(screen.getByRole("button", { name: "Production date" }));
  await user.click(screen.getByRole("button", { name: /May 13/ }));
  expect(screen.getByRole("status").textContent).toBe("2026-5-13");
});

function RangeExample() {
  const [value, setValue] = useState<DateRange | null>(null);
  return <><DateRangePicker id="report-period" label="Report period" value={value} onChange={setValue}
    minDate={new Date(2026, 4, 1)} maxDate={new Date(2026, 4, 31)} />
    <output>{value?.from ? `${value.from.getDate()}-${value.to?.getDate() ?? ""}` : "empty"}</output></>;
}

it("selects both ends of a date range", async () => {
  const user = userEvent.setup();
  render(<RangeExample />);
  await user.click(screen.getByRole("button", { name: "Report period" }));
  await user.click(screen.getByRole("button", { name: /May 12/ }));
  await user.click(screen.getByRole("button", { name: /May 16/ }));
  expect(screen.getByRole("status").textContent).toBe("12-16");
});

it("can replace an existing date range", async () => {
  const user = userEvent.setup();
  function ExistingRange() {
    const [value, setValue] = useState<DateRange | null>({ from: new Date(2026, 4, 12), to: new Date(2026, 4, 16) });
    return <><DateRangePicker id="period" label="Period" value={value} onChange={setValue} />
      <output>{value?.from ? `${value.from.getDate()}-${value.to?.getDate() ?? ""}` : "empty"}</output></>;
  }
  render(<ExistingRange />);
  await user.click(screen.getByRole("button", { name: "Period" }));
  await user.click(screen.getByRole("button", { name: "New range" }));
  await user.click(screen.getByRole("button", { name: /May 20/ }));
  await user.click(screen.getByRole("button", { name: /May 23/ }));
  expect(screen.getByRole("status").textContent).toBe("20-23");
});

function MonthExample() {
  const [value, setValue] = useState<string | null>("2026-05");
  return <><MonthYearPicker id="expiry-month" label="Expiry month" value={value} onChange={setValue}
    minMonth="2026-01" maxMonth="2027-12" />
    <output>{value ?? "empty"}</output></>;
}

it("selects month and year without inventing a day", async () => {
  const user = userEvent.setup();
  render(<MonthExample />);
  await user.click(screen.getByRole("button", { name: "Expiry month" }));
  await user.click(screen.getByRole("combobox", { name: "Month" }));
  await user.click(screen.getByRole("option", { name: "June" }));
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(screen.getByRole("status").textContent).toBe("2026-06");
});
