// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, expect, it } from "vitest";
import { emptyReportFilters } from "../schemas/report-filters";
import { useDependentReportFilters } from "./use-dependent-report-filters";
afterEach(cleanup);

it("clears dependent selections when a parent changes or returns to All, and preserves explicit reset snapshots", () => {
  const { result } = renderHook(() => {
    const form = useForm({ defaultValues: emptyReportFilters() });
    const reset = useDependentReportFilters(form);
    return { form, reset };
  });
  act(() => result.current.form.setValue("selections.materialKind", [{ value: "0", label: "Raw" }]));
  act(() => result.current.form.setValue("selections.material", [{ value: "m", label: "Material" }]));
  act(() => result.current.form.setValue("selections.materialKind", []));
  expect(result.current.form.getValues("selections.material")).toEqual([]);
  const applied = emptyReportFilters(); applied.selections.materialKind = [{ value: "1", label: "Packaging" }]; applied.selections.material = [{ value: "p", label: "Carton" }];
  act(() => result.current.reset(applied));
  expect(result.current.form.getValues("selections.material")).toEqual(applied.selections.material);
});
