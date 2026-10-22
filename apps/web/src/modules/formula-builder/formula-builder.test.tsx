// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { canAccess } from "@/shared/auth/access";
import { modules } from "../registry";
import { routeAccessPolicy } from "../registry-model";
import { FormulaBuilderPage } from "./components/formula-builder-page";
import { calculate, keyProblem, preview, source, type Operand, type Token } from "./lib/expression";

afterEach(cleanup);
const a: Operand = { key: "a", label: "Mass", value: "9" };
const b: Operand = { key: "b", label: "Volume", value: "2" };

it("guards the formula builder and sends the CRM job request address to job requests", () => {
  const can = (path: string, keys: string[]) => { const p = routeAccessPolicy(modules, path); return Boolean(p && canAccess(p.access, { state: "authenticated", permissions: new Set(keys) })); };
  expect(can("/formula", ["CanViewRndFormulations"])).toBe(false);
  expect(can("/formula", ["CanViewFormulaBuilder"])).toBe(true);
  expect(can("/crm/jobs/job-request", ["CanViewJobRequests"])).toBe(true);
});

it("evaluates with real powers and functions and never runs the text as code", () => {
  const tokens: Token[] = [{ kind: "function", name: "sqrt" }, { kind: "operand", key: "a" }, { kind: "close" }, { kind: "operator", symbol: "^" }, { kind: "operand", key: "b" }];
  expect(source(tokens)).toBe("sqrt(a) ^ b");
  expect(preview(tokens, [a, b])).toBe("sqrt(9) ^ 2");
  // In JavaScript 3 ^ 2 would be 1 (bitwise XOR); here it is a power.
  expect(calculate(tokens, [a, b])).toEqual({ state: "result", value: 9 });
  expect(calculate(tokens.slice(0, 4), [a, b]).state).toBe("incomplete");
  expect(calculate(tokens.slice(0, 2), [a]).state).toBe("incomplete");
  expect(calculate([{ kind: "operand", key: "a" }, { kind: "operator", symbol: "/" }, { kind: "operand", key: "b" }], [a, { ...b, value: "0" }]).state).toBe("invalid");
  expect(calculate([{ kind: "function", name: "sqrt" }, { kind: "operand", key: "a" }, { kind: "close" }], [{ ...a, value: "-4" }]).state).toBe("invalid");
  expect(keyProblem("pi")).toMatch(/already means/);
  expect(keyProblem("constructor()")).toMatch(/starts with a letter/);
  expect(keyProblem("mass_1")).toBeNull();
});

it("builds an expression, then recalculates when a value changes", async () => {
  const user = userEvent.setup();
  render(<FormulaBuilderPage />);
  const add = async (key: string, label: string, value: string) => {
    await user.type(screen.getByLabelText("Key"), key); await user.type(screen.getByLabelText("Label"), label); await user.type(screen.getByLabelText("Value"), value);
    await user.click(screen.getByRole("button", { name: "Add value" }));
  };
  await add("m", "Mass", "10");
  expect(screen.getByRole("button", { name: "Add value" })).toHaveProperty("disabled", true);
  await user.click(screen.getByRole("button", { name: "Divide" }));
  await add("v", "Volume", "4");
  expect(screen.getByLabelText("Expression source").textContent).toBe("m / v");
  expect(screen.getByLabelText("Result").textContent).toBe("2.5");
  await user.clear(screen.getByLabelText(/^Volume/)); await user.type(screen.getByLabelText(/^Volume/), "5");
  expect(screen.getByLabelText("Result").textContent).toBe("2");
  await user.click(screen.getByRole("button", { name: "Undo" }));
  expect(screen.queryByLabelText(/^Volume/)).toBeNull();
  expect(screen.getByText(/ends with an operator/)).toBeTruthy();
});
