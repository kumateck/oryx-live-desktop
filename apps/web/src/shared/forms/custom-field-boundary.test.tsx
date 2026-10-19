// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, expect, it, vi } from "vitest";
import { FormWizard } from "./form-wizard";
import { InputTypes } from "./input-types";
import type { CustomFieldProps, WizardField } from "./form-wizard-types";

const loaded = ({ id }: CustomFieldProps<{ observation: string; formula: string }>) => <div id={id}>Calculation ready</div>;
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("retries a failed custom renderer while keeping other unsaved answers", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const load = vi.fn().mockRejectedValueOnce(new Error("Chunk unavailable")).mockResolvedValue({ default: loaded });
  const fields: WizardField<{ observation: string; formula: string }>[] = [
    { name: "observation", label: "Observation", type: InputTypes.TEXT },
    { name: "formula", label: "Assay", type: InputTypes.CUSTOM, load },
  ];
  function Form() {
    const form = useForm({ defaultValues: { observation: "Unsaved reading", formula: "" } });
    return <FormWizard form={form} fields={fields} />;
  }
  render(<Form />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect((screen.getByRole("textbox", { name: "Observation" }) as HTMLInputElement).value).toBe("Unsaved reading");
  fireEvent.click(screen.getByRole("button", { name: "Retry field" }));
  expect(await screen.findByText("Calculation ready")).toBeTruthy();
  expect(load).toHaveBeenCalledTimes(2);
  expect((screen.getByRole("textbox", { name: "Observation" }) as HTMLInputElement).value).toBe("Unsaved reading");
});
