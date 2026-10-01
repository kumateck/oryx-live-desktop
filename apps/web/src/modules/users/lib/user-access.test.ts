import { expect, it } from "vitest";
import { employeeOptionSchema, roleOptionSchema, userListSchema } from "../schemas/user-schema";
import { allowedStatuses, disabledFilter, resolveStatus, statusFromParam, statusToParam } from "./user-access";

it("reads the status tab from the address the way Oryx Next writes it", () => {
  expect(statusFromParam(null)).toBe("active");
  expect(statusFromParam("0")).toBe("active");
  expect(statusFromParam("1")).toBe("inactive");
  expect(statusFromParam("junk")).toBe("active");
  expect(statusToParam("inactive")).toBe("1");
});

it("opens only a tab the user may view", () => {
  expect(allowedStatuses({ viewActive: true, viewInactive: true })).toEqual(["active", "inactive"]);
  expect(resolveStatus("inactive", ["active"])).toBe("active");
  expect(resolveStatus("active", ["inactive"])).toBe("inactive");
  expect(resolveStatus("active", [])).toBeNull();
});

it("asks the list endpoint for blocked accounts only on the inactive tab", () => {
  expect(disabledFilter("active")).toBe(false);
  expect(disabledFilter("inactive")).toBe(true);
});

it("normalises user records and tolerates missing fields", () => {
  const users = userListSchema.parse([
    { id: "258da105-a506-44a9-8ff5-8d005a54f294", firstName: " Ada ", lastName: "Mensah", email: "ada@example.com", isDisabled: false,
      avatar: "http://10.0.0.5:8086/api/v1/file/avatar/ada.png", createdAt: "2026-01-02T00:00:00Z", department: { name: "Quality" },
      roles: [{ id: "11111111-1111-4111-8111-111111111111", name: "qa", displayName: "QA Manager" }] },
    { id: "358da105-a506-44a9-8ff5-8d005a54f294", firstName: null, lastName: null, email: "kofi@example.com", roles: null, department: null },
  ]);
  expect(users[0]).toMatchObject({ name: "Ada Mensah", department: "Quality", avatar: "/api/v1/file/avatar/ada.png", role: { name: "qa" } });
  expect(users[1]).toMatchObject({ name: "kofi@example.com", department: null, role: null, isDisabled: false, avatar: null });
  expect(userListSchema.safeParse([{ id: "not-an-id" }]).success).toBe(false);
});

it("labels role and employee options, falling back when a display name is missing", () => {
  expect(roleOptionSchema.parse([{ id: "11111111-1111-4111-8111-111111111111", name: "qa", displayName: "" }])[0]?.label).toBe("qa");
  expect(employeeOptionSchema.parse({ id: "258da105-a506-44a9-8ff5-8d005a54f294", firstName: "Ada", lastName: "Mensah", email: "", department: null }))
    .toEqual({ id: "258da105-a506-44a9-8ff5-8d005a54f294", name: "Ada Mensah", email: null, department: null });
});
