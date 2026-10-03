// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { permissionFixture } from "@/modules/roles/lib/permission-fixtures";
import { setPermissionAccess } from "@/modules/roles/lib/permission-groups";
import { usePermissionsWorkspace } from "./use-permissions-workspace";

const mocks = vi.hoisted(() => ({ update: vi.fn(), refresh: vi.fn(), refetch: vi.fn(), has: vi.fn(() => true), assignments: vi.fn(), catalog: vi.fn() }));
const first = { value: "00000000-0000-4000-8000-000000000001", label: "Buyer" };
const second = { value: "00000000-0000-4000-8000-000000000002", label: "Analyst" };
vi.mock("@/modules/roles/api/role-api", () => ({
  useGetApiV1RoleQuery: () => ({ data: [first, second].map((item) => ({ id: item.value, name: item.label, displayName: item.label, type: 0 })), isLoading: false }),
  useGetApiV1PermissionModulesQuery: mocks.catalog,
  useGetApiV1PermissionRoleByRoleIdQuery: mocks.assignments,
  usePutApiV1PermissionRoleByRoleIdMutation: () => [mocks.update, { isLoading: false }],
}));
vi.mock("@/shared/auth/use-access", () => ({ useAccess: () => ({ has: mocks.has, allowsNow: mocks.has }) }));
vi.mock("@/shared/auth/session-provider", () => ({ useSession: () => ({ refresh: mocks.refresh }) }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.has.mockReturnValue(true);
  mocks.catalog.mockReturnValue({ currentData: permissionFixture, isFetching: false, refetch: mocks.refetch });
  mocks.assignments.mockReturnValue({ currentData: permissionFixture, isFetching: false, refetch: mocks.refetch });
  mocks.update.mockResolvedValue({ data: undefined });
});
afterEach(cleanup);

it("keeps a dirty role until the administrator discards or cancels the switch", () => {
  const { result } = renderHook(usePermissionsWorkspace);
  act(() => result.current.chooseRole(first));
  act(() => result.current.change(setPermissionAccess(result.current.permissions, "Procurement", new Set(["edit"]), true)));
  act(() => result.current.chooseRole(second));
  expect(result.current.role).toEqual(first);
  expect(result.current.pendingRole).toEqual(second);
  expect(result.current.changes).toBe(1);
  act(() => result.current.cancelRoleChange());
  expect(result.current.pendingRole).toBeNull();
  expect(result.current.changes).toBe(1);
  act(() => result.current.chooseRole(second));
  act(() => result.current.discardAndChangeRole());
  expect(result.current.role).toEqual(second);
  expect(result.current.changes).toBe(0);
});

it("keeps failed-save edits for retry and saves the full catalog with audit metadata", async () => {
  const { result } = renderHook(usePermissionsWorkspace);
  act(() => result.current.chooseRole(first));
  act(() => result.current.change(setPermissionAccess(result.current.permissions, "Procurement", new Set(["edit"]), true)));
  mocks.update.mockResolvedValueOnce({ error: { status: 500, data: { message: "Unavailable" } } });
  await act(async () => { expect(await result.current.save()).toBeTruthy(); });
  expect(result.current.changes).toBe(1);
  expect(mocks.refresh).not.toHaveBeenCalled();
  await act(async () => { expect(await result.current.save()).toBeNull(); });
  expect(mocks.update).toHaveBeenLastCalledWith({ roleId: first.value, module: "Access Management", subModule: "Manage Permissions", body: expect.arrayContaining([expect.objectContaining({ module: "Finance" })]) });
  expect(result.current.changes).toBe(0);
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

it("never shows cached assignments from the previous role while the next loads", () => {
  mocks.assignments.mockReturnValue({ data: permissionFixture, currentData: undefined, isFetching: true });
  const { result } = renderHook(usePermissionsWorkspace);
  act(() => result.current.chooseRole(second));
  expect(result.current.loading).toBe(true);
  expect(result.current.permissions).toEqual([]);
});

it("blocks editing and saving for a view-only administrator", async () => {
  mocks.has.mockReturnValue(false);
  const { result } = renderHook(usePermissionsWorkspace);
  act(() => result.current.chooseRole(first));
  act(() => result.current.change(setPermissionAccess(result.current.permissions, "Procurement", new Set(["edit"]), true)));
  expect(result.current.changes).toBe(0);
  await act(async () => { expect(await result.current.save()).toBeTruthy(); });
  expect(mocks.update).not.toHaveBeenCalled();
});

it("rechecks access when a retained save callback runs after revocation", async () => {
  const { result } = renderHook(usePermissionsWorkspace);
  act(() => result.current.chooseRole(first));
  act(() => result.current.change(setPermissionAccess(result.current.permissions, "Procurement", new Set(["edit"]), true)));
  const save = result.current.save;
  mocks.has.mockReturnValue(false);
  await act(async () => { expect(await save()).toBeTruthy(); });
  expect(mocks.update).not.toHaveBeenCalled();
  expect(result.current.changes).toBe(1);
});
