// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { reportDefinition } from "../lib/catalog";
import { ReportKey, type ReportOutput } from "../lib/report-model";
import { emptyReportFilters } from "../schemas/report-filters";
import { useReportRunner } from "./use-report-runner";

const mocks = vi.hoisted(() => ({ load: vi.fn<() => Promise<ReportOutput>>(), access: vi.fn<() => string | null>(), dispatch: vi.fn() }));
vi.mock("@/shared/api/use-api-dispatch", () => ({ useApiDispatch: () => mocks.dispatch }));
vi.mock("@/shared/auth/use-permission-action", () => ({ usePermissionAction: () => ({ check: mocks.access }) }));
vi.mock("../api/warehouse-reports", () => ({ loadWarehouseReport: mocks.load }));
beforeEach(() => { vi.clearAllMocks(); mocks.access.mockReturnValue(null); mocks.load.mockResolvedValue({ sheets: [{ name: "Stock", columns: ["Quantity"], rows: [{ id: "0", cells: [0] }] }] }); });
afterEach(cleanup);

it("keeps an immutable submitted snapshot and preserves it when a later request fails", async () => {
  const { result } = renderHook(() => useReportRunner(reportDefinition(ReportKey.MaterialStockSummary)));
  const filters = emptyReportFilters(); filters.selections.materialKind = [{ value: "0", label: "Raw material" }];
  await act(async () => { expect(await result.current.run(filters)).toBe(true); });
  const successful = result.current.book;
  filters.selections.materialKind[0] = { value: "1", label: "Packaging material" };
  expect(successful?.filters).toContainEqual({ label: "Material type", value: "Raw material" });
  mocks.load.mockRejectedValueOnce(new Error("Connection lost"));
  await act(async () => { expect(await result.current.run(filters)).toBe(false); });
  expect(result.current.book).toBe(successful); expect(result.current.error).toBe("Connection lost");
});

it("checks current permission before loading and after the asynchronous report read", async () => {
  const { result } = renderHook(() => useReportRunner(reportDefinition(ReportKey.MaterialStockSummary)));
  mocks.access.mockReturnValue("Access revoked");
  await act(async () => { await result.current.run(emptyReportFilters()); });
  expect(mocks.load).not.toHaveBeenCalled(); expect(result.current.book).toBeNull();
  mocks.access.mockReturnValueOnce(null).mockReturnValueOnce(null).mockReturnValue("Access revoked");
  await act(async () => { await result.current.run(emptyReportFilters()); });
  expect(mocks.load).toHaveBeenCalledOnce(); expect(result.current.book).toBeNull(); expect(result.current.error).toBe("Access revoked");
});

it("does not publish a late result after generation was cancelled", async () => {
  let finish: (value: ReportOutput) => void = () => { throw new Error("No pending request"); };
  mocks.load.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const { result } = renderHook(() => useReportRunner(reportDefinition(ReportKey.MaterialStockSummary)));
  let pending: Promise<boolean | undefined> = Promise.resolve(false);
  await act(async () => { pending = result.current.run(emptyReportFilters()); });
  act(() => result.current.cancel());
  await act(async () => { finish({ sheets: [] }); await pending; });
  expect(result.current.busy).toBe(false); expect(result.current.book).toBeNull();
});
