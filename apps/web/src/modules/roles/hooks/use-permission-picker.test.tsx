// @vitest-environment jsdom
import { useLayoutEffect } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { permissionFixture } from "../lib/permission-fixtures";
import { usePermissionPicker } from "./use-permission-picker";

afterEach(cleanup);
it("keeps the committed search text, mode and rows in sync when navigating or clearing", () => {
  const frames: { search: string; searching: boolean; keys: string[]; group: string; module: string }[] = [];
  const { result } = renderHook(() => {
    const picker = usePermissionPicker(permissionFixture, () => {}, false);
    useLayoutEffect(() => {
      frames.push({ search: picker.search, searching: picker.searching, keys: picker.visible.map((row) => row.item.key), group: picker.group, module: picker.selected?.module ?? "" });
    });
    return picker;
  });
  act(() => result.current.setSearch("invoices"));
  act(() => result.current.chooseGroup("Orders"));
  act(() => result.current.setSearch("invoices"));
  act(() => result.current.chooseModule("Finance"));
  act(() => result.current.setSearch("suppliers"));
  act(() => result.current.setSearch("no-such-permission"));
  act(() => result.current.setSearch(""));
  for (const frame of frames) {
    expect(frame.searching).toBe(Boolean(frame.search.trim()));
    if (frame.search === "invoices") expect(frame.keys).toEqual(["pay"]);
    if (frame.search === "no-such-permission") expect(frame.keys).toEqual([]);
    if (!frame.search && frame.module === "Procurement" && frame.group === "Orders") expect(frame.keys).toEqual(["purchase"]);
    if (!frame.search && frame.module === "Finance") expect(frame.keys).toEqual(["pay"]);
  }
});
