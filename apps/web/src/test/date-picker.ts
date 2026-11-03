import { screen } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

/** Pick a calendar date through the same controls as a keyboard user. */
export async function chooseDate(user: ReturnType<typeof userEvent.setup>, label: string, year: number, month: number, day: number) {
  await user.click(await screen.findByRole("button", { name: label }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Choose the Year" }), String(year));
  await user.selectOptions(screen.getByRole("combobox", { name: "Choose the Month" }), String(month - 1));
  const name = new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  await user.click(screen.getByRole("button", { name: new RegExp(name + "(?:[^0-9]|$)") }));
}
