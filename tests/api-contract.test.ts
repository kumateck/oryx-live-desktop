import assert from "node:assert/strict";
import test from "node:test";
import { createContractInspector, owningTag, type Contract, type Operation } from "../scripts/api-contract.ts";

const json = (schema: object) => ({ content: { "application/json": { schema } } });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const contract: Contract = {
  paths: {},
  components: { schemas: {
    Role: { type: "object", properties: { id: { type: "string" }, parent: ref("Role") } },
    Loose: { type: "object", properties: { payload: {} } },
    Wrapper: { type: "object", properties: { items: { type: "array", items: ref("Cycle") } } },
    Cycle: { type: "object", properties: { back: ref("Wrapper"), loose: ref("Loose") } },
    "Microsoft.AspNetCore.Mvc.ProblemDetails": { type: "object", additionalProperties: {} },
  } },
};
const { operationGap } = createContractInspector(contract);
const operation = (partial: Partial<Operation>): Operation => ({ responses: { "200": json(ref("Role")) }, ...partial });

test("accepts typed bodies, self-referencing DTOs, and true no-content responses", () => {
  assert.equal(operationGap(operation({})), null);
  assert.equal(operationGap(operation({ responses: { "204": {} } })), null);
  assert.equal(operationGap(operation({ responses: { "200": json(ref("Role")),
    "400": json(ref("Microsoft.AspNetCore.Mvc.ProblemDetails")) } })), null);
});

test("rejects a success response whose body type is not declared", () => {
  assert.match(operationGap(operation({ responses: { "200": {} } })) ?? "", /200 response has no declared body type/);
  assert.match(operationGap(operation({ responses: { "202": {} } })) ?? "", /202 response/);
  assert.match(operationGap(operation({ responses: { "400": {} } })) ?? "", /no success response/);
});

test("rejects untyped schemas reached through references and cycles", () => {
  assert.match(operationGap(operation({ responses: { "200": json(ref("Loose")) } })) ?? "", /Loose\.payload has no declared type/);
  assert.match(operationGap(operation({ responses: { "200": json(ref("Wrapper")) } })) ?? "", /Loose\.payload/);
  assert.match(operationGap(operation({ requestBody: json({}) })) ?? "", /request body/);
  assert.match(operationGap(operation({ parameters: [{ name: "filter" }] })) ?? "", /parameter filter has no schema/);
});

test("assigns an operation to the domain of its first tag", () => {
  assert.equal(owningTag(operation({ tags: ["Approval", "Role"] })), "Approval");
  assert.equal(owningTag(operation({})), null);
});
