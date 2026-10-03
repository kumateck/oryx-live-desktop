import { expect, it } from "vitest";
import { mergeBreadcrumbTrail } from "./breadcrumb-trail";

it("uses the explicit route's label without repeating the automatic parent", () => {
  expect(mergeBreadcrumbTrail([{ label: "Settings" }, { label: "Manage sites", to: "/settings/sites" }],
    [{ label: "Sites", to: "/settings/sites/" }, { label: "Edit" }]))
    .toEqual([{ label: "Settings" }, { label: "Sites", to: "/settings/sites/" }, { label: "Edit" }]);
});

it("preserves query-selected parents and compares equivalent query strings", () => {
  expect(mergeBreadcrumbTrail([{ label: "Warehouse" }, { label: "Raw", to: "/materials?type=0&status=active" }],
    [{ label: "Raw materials", to: "/materials?status=active&type=0" }, { label: "Material" }]))
    .toHaveLength(3);
  expect(mergeBreadcrumbTrail([{ label: "Raw", to: "/materials?type=0" }],
    [{ label: "Packaging", to: "/materials?type=1" }])).toHaveLength(2);
});

it("lets explicit parents add filters to generic or partially filtered list links", () => {
  expect(mergeBreadcrumbTrail([{ label: "Materials", to: "/materials" }],
    [{ label: "Raw materials", to: "/materials?type=0" }, { label: "Material" }]))
    .toEqual([{ label: "Raw materials", to: "/materials?type=0" }, { label: "Material" }]);
  expect(mergeBreadcrumbTrail([{ label: "Pending receiving", to: "/receiving?status=0" }],
    [{ label: "Pending receiving", to: "/receiving?status=0&type=0" }, { label: "Checklist" }]))
    .toHaveLength(2);
});

it("replaces inferred descendants when the page supplies its own parent hierarchy", () => {
  expect(mergeBreadcrumbTrail([{ label: "Workflow" }, { label: "Approvals", to: "/approvals" }, { label: "Inferred queue" }],
    [{ label: "Approvals", to: "/approvals" }, { label: "Specific queue", to: "/approvals/queue" }, { label: "Request" }]))
    .toEqual([{ label: "Workflow" }, { label: "Approvals", to: "/approvals" }, { label: "Specific queue", to: "/approvals/queue" }, { label: "Request" }]);
});

it("does not collapse equal labels on different pages or loading placeholders", () => {
  expect(mergeBreadcrumbTrail([{ label: "Users", to: "/users" }], [{ label: "Users", to: "/other-users" }, { label: null }]))
    .toEqual([{ label: "Users", to: "/users" }, { label: "Users", to: "/other-users" }, { label: null }]);
  expect(mergeBreadcrumbTrail([{ label: "Users", to: "/users" }], [{ label: "Users" }])).toHaveLength(2);
});
