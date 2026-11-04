// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { scheduleRowSchema } from "../../schemas/schedule-schema";
import { groupBatches } from "../../lib/schedule-batches";
import { BatchNav } from "./batch-nav";

it("filters products by name/code and batches by their original label without changing selection", () => {
  const product = { id: "p1", name: "Amoxicillin", code: "BFC-04" };
  const schedule = scheduleRowSchema.parse({ id: "658da105-a506-44a9-8ff5-8d005a54f294", products: [
    { id: "b1", product, batchNumber: "BFC4K338" }, { id: "b2", product },
    { id: "b3", product: { id: "p2", name: "Cold relief", code: "NT-082" }, batchNumber: "CL009" },
  ] });
  const select = vi.fn();
  render(<BatchNav groups={groupBatches(schedule.products)} scheduleEnd={null} active="b1" onSelect={select} />);
  const input = screen.getByRole("searchbox", { name: "Search products and batches" });
  const buttons = () => within(screen.getByRole("navigation", { name: "Batches" })).getAllByRole("button");
  fireEvent.change(input, { target: { value: " AMOX " } });
  expect(buttons()).toHaveLength(2);
  expect(screen.getByRole("button", { name: /BFC4K338/ }).getAttribute("aria-current")).toBe("true");
  fireEvent.change(input, { target: { value: "nt-082" } });
  expect(buttons()).toHaveLength(1); expect(screen.getByText("Cold relief")).toBeTruthy();
  fireEvent.change(input, { target: { value: "4k338" } });
  expect(buttons()).toHaveLength(1); expect(screen.getByText("BFC4K338")).toBeTruthy();
  fireEvent.change(input, { target: { value: "Batch 2" } });
  expect(buttons()).toHaveLength(1); expect(select).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /Batch 2/ })); expect(select).toHaveBeenCalledWith("b2");
  fireEvent.change(input, { target: { value: "absent" } });
  expect(screen.getByRole("status").textContent).toBe("No matching products or batches.");
  fireEvent.change(input, { target: { value: "" } }); expect(buttons()).toHaveLength(3);
});
