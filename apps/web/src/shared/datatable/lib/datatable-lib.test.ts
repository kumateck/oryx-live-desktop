import { expect, it } from "vitest";
import { clampPage, pageCount, pageMeta, pageSizeOptions, pageWindow, rowRange } from "./pagination";
import { moveRowById, parseNumberInput, updateRowById } from "./row-updates";

it("always has at least one page and tolerates bad input", () => {
  expect(pageCount(0, 20)).toBe(1);
  expect(pageCount(41, 20)).toBe(3);
  expect(pageCount(Number.NaN, 0)).toBe(1);
  expect(clampPage(9, 41, 20)).toBe(3);
  expect(clampPage(0, 41, 20)).toBe(1);
  expect(clampPage(Number.NaN, 41, 20)).toBe(1);
});

it("reports the rows actually on the page", () => {
  expect(rowRange(1, 20, 0, 0)).toEqual({ from: 0, to: 0 });
  expect(rowRange(3, 20, 41, 1)).toEqual({ from: 41, to: 41 });
  expect(rowRange(2, 20, 100, 7)).toEqual({ from: 21, to: 27 });
});

it("shows first, last, and the pages around the current one", () => {
  expect(pageWindow(1, 1)).toEqual([1]);
  expect(pageWindow(1, 5)).toEqual([1, 2, "gap", 5]);
  expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  expect(pageWindow(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
  expect(pageWindow(99, 20)).toEqual([1, "gap", 19, 20]);
});

it("offers the page size in use even when it is not a standard one", () => {
  expect(pageSizeOptions(5)).toEqual([5, 10, 20, 30, 50, 100]);
  expect(pageSizeOptions(30)).toEqual([10, 20, 30, 50, 100]);
});

it("reads the backend paging envelope defensively", () => {
  expect(pageMeta({ pageIndex: 2, totalRecordCount: 45 }, { page: 2, pageSize: 20 }, 20)).toEqual({ page: 2, pageSize: 20, totalRows: 45 });
  expect(pageMeta(undefined, { page: 3, pageSize: 20 }, 4)).toEqual({ page: 3, pageSize: 20, totalRows: 44 });
  expect(pageMeta({ pageIndex: null, totalRecordCount: Number.NaN }, { page: 1, pageSize: 20 }, 0)).toEqual({ page: 1, pageSize: 20, totalRows: 0 });
});

const rows = [{ id: "a", qty: 1 }, { id: "b", qty: 2 }, { id: "c", qty: 3 }];
const id = (row: { id: string }) => row.id;

it("updates and moves rows by ID, not position", () => {
  expect(updateRowById(rows, id, "b", { qty: 9 })).toEqual([{ id: "a", qty: 1 }, { id: "b", qty: 9 }, { id: "c", qty: 3 }]);
  expect(updateRowById(rows, id, "missing", { qty: 9 })).toEqual(rows);
  expect(moveRowById(rows, id, "a", "c")).toEqual({ rows: [rows[1], rows[2], rows[0]], from: 0, to: 2 });
  expect(moveRowById(rows, id, "a", "a")).toBeNull();
  expect(moveRowById(rows, id, "a", "missing")).toBeNull();
});

it("turns typed numbers into values without producing NaN", () => {
  expect(parseNumberInput(" 1,250.5 ")).toBe(1250.5);
  expect(parseNumberInput("")).toBeNull();
  expect(parseNumberInput("12abc")).toBeNull();
  expect(parseNumberInput("1e9")).toBeNull();
  expect(parseNumberInput("-4", { min: 0 })).toBe(0);
  expect(parseNumberInput("400", { max: 100 })).toBe(100);
});

import { pageSlice } from "./pagination";
import { filterOptions, selectionSummary, toggleValue } from "./options";
import { pageSelectionState, togglePageSelected, toggleRowSelected } from "./selection";
import { columnLabel } from "./column-label";

it("cuts one page out of a list and never returns an out-of-range page", () => {
  const list = [1, 2, 3, 4, 5];
  expect(pageSlice(list, 2, 2)).toEqual([3, 4]);
  expect(pageSlice(list, 9, 2)).toEqual([5]);
  expect(pageSlice([], 1, 20)).toEqual([]);
});

it("selects by row ID without touching rows on other pages", () => {
  const selected = toggleRowSelected(new Set(["x"]), "a");
  expect([...selected]).toEqual(["x", "a"]);
  expect(pageSelectionState(selected, ["a", "b"])).toBe("some");
  const page = togglePageSelected(selected, ["a", "b"]);
  expect([...page].sort()).toEqual(["a", "b", "x"]);
  expect(pageSelectionState(page, ["a", "b"])).toBe("all");
  expect([...togglePageSelected(page, ["a", "b"])]).toEqual(["x"]);
  expect(pageSelectionState(new Set(), [])).toBe("none");
});

const options = [{ value: "kg", label: "Kilogram" }, { value: "g", label: "Gram" }, { value: "l", label: "Litre" }];

it("searches, summarises, and toggles options", () => {
  expect(filterOptions(options, " GRAM ").map((option) => option.value)).toEqual(["kg", "g"]);
  expect(selectionSummary(options, [], true)).toBeNull();
  expect(selectionSummary(options, ["kg", "l"], true)).toBe("Kilogram, Litre");
  expect(selectionSummary(options, ["kg", "g", "l"], true)).toBe("3 selected");
  expect(selectionSummary(options, ["gone"], false)).toBe("1 unavailable");
  expect(toggleValue(["kg"], "g")).toEqual(["kg", "g"]);
  expect(toggleValue(["kg", "g"], "kg")).toEqual(["g"]);
});

it("makes a readable label from a column ID", () => {
  expect(columnLabel("unitPrice")).toBe("Unit price");
  expect(columnLabel("created_at")).toBe("Created at");
});
