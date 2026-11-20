// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { stepStatus } from "../lib/step-status";
import { StepStatusBadge } from "./step-status-badge";

afterEach(cleanup);

it("says Waiting on a board card for a step no one has begun, and Not started elsewhere", () => {
  render(<StepStatusBadge status={stepStatus.new} waiting />);
  expect(screen.getByText("Waiting")).toBeTruthy();
  cleanup();
  render(<StepStatusBadge status={stepStatus.new} />);
  expect(screen.getByText("Not started")).toBeTruthy();
  cleanup();
  render(<StepStatusBadge status={stepStatus.inProgress} waiting />);
  expect(screen.getByText("In progress")).toBeTruthy();
});
