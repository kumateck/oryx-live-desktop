import { type Json, type ObjectValue } from "../customer-server/data.ts";

type Fields = readonly string[];
interface CriticalOperation { method: string; path: string; response?: Fields; request?: Fields; supplied?: Fields; }
/** Only transport fields consumed by these critical Live journeys; unrelated APIs are not release gates. */
export const criticalOperations: readonly CriticalOperation[] = [
  { method: "post", path: "/api/v1/auth/login", request: ["email", "password"], supplied: ["email", "password"], response: ["userId", "accessToken", "refreshToken"] },
  { method: "post", path: "/api/v1/auth/login-with-refresh-token", request: ["clientId", "refreshToken"], supplied: ["clientId", "refreshToken"], response: ["userId", "accessToken", "refreshToken"] },
  { method: "get", path: "/api/v1/user/authenticated", response: ["id", "isDisabled", "department.id", "department.type"] },
  { method: "get", path: "/api/v1/permission/user/{userId}", response: ["*.isActive", "*.children.*.key", "*.children.*.types.*"] },
  { method: "get", path: "/api/v1/production-schedule/activity/{productionActivityId}", response: ["id", "status", "steps.*.id", "steps.*.status", "currentStep.id"] },
  { method: "put", path: "/api/v1/production-schedule/activity-step/{productionStepId}/status" },
  { method: "post", path: "/api/v1/approval/approve/{modelType}/{modelId}", request: ["comments"], supplied: ["comments"] },
  { method: "post", path: "/api/v1/approval/reject/{modelType}/{modelId}", request: ["comments", "responseRejectionOutcome"], supplied: ["comments"] },
];
const record = (value: Json | undefined): ObjectValue | null => value && typeof value === "object" && !Array.isArray(value) ? value : null;
const strings = (value: Json | undefined): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

function schema(document: ObjectValue, value: Json | undefined, seen = new Set<string>()): ObjectValue | null {
  const node = record(value);
  if (!node || node.oneOf || node.anyOf) return null; // Ambiguous evidence is not a confirmed incompatibility.
  if (typeof node.$ref === "string") {
    if (!node.$ref.startsWith("#/") || seen.has(node.$ref)) return null;
    let target: Json | undefined = document;
    for (const key of node.$ref.slice(2).split("/")) target = record(target)?.[key.replace(/~1/g, "/").replace(/~0/g, "~")];
    return schema(document, target, new Set([...seen, node.$ref]));
  }
  if (Array.isArray(node.allOf)) {
    const combined: ObjectValue = { ...node, properties: { ...record(node.properties) }, required: strings(node.required) };
    delete combined.allOf;
    for (const part of node.allOf) {
      const resolved = schema(document, part, seen);
      if (!resolved) return null;
      combined.type ??= resolved.type ?? "object";
      combined.properties = { ...record(combined.properties), ...record(resolved.properties) };
      combined.required = [...strings(combined.required), ...strings(resolved.required)];
    }
    return combined;
  }
  return node;
}

function field(document: ObjectValue, root: Json | undefined, path: string): { state: "known"; schema: ObjectValue } | { state: "missing" } | { state: "unknown" } {
  let current = schema(document, root);
  for (const part of path ? path.split(".") : []) {
    if (!current) return { state: "unknown" };
    if (part === "*") {
      if (typeof current.type === "string" && current.type !== "array") return { state: "missing" };
      current = schema(document, current.items);
    } else {
      if (typeof current.type === "string" && current.type !== "object") return { state: "missing" };
      const properties = record(current.properties);
      if (!properties) return { state: "unknown" };
      if (!(part in properties)) return { state: "missing" };
      current = schema(document, properties[part]);
    }
  }
  return current ? { state: "known", schema: current } : { state: "unknown" };
}
function compatibleType(expected: ObjectValue, actual: ObjectValue): boolean {
  if (typeof expected.type !== "string" || typeof actual.type !== "string") return true;
  return expected.type === actual.type || (["integer", "number"].includes(expected.type) && ["integer", "number"].includes(actual.type));
}
function jsonSchema(document: ObjectValue, value: Json | undefined): ObjectValue | null {
  const content = record(record(value)?.content);
  return schema(document, record(content?.["application/json"])?.schema);
}
function responseSchema(document: ObjectValue, operation: ObjectValue): ObjectValue | null {
  const responses = record(operation.responses);
  for (const [code, response] of Object.entries(responses ?? {})) {
    if (!/^2\d\d$/.test(code)) continue;
    const result = jsonSchema(document, response);
    if (result) return result;
  }
  return null;
}
function parameters(document: ObjectValue, operation: ObjectValue): ObjectValue[] {
  return Array.isArray(operation.parameters) ? operation.parameters.flatMap((value) => { const item = schema(document, value); return item ? [item] : []; }) : [];
}

export function checkCriticalContract(actual: ObjectValue, baseline: ObjectValue): { breaking: string[]; warnings: string[] } {
  const breaking: string[] = []; const warnings: string[] = [];
  for (const critical of criticalOperations) {
    const label = `${critical.method.toUpperCase()} ${critical.path}`;
    const expected = record(record(record(baseline.paths)?.[critical.path])?.[critical.method]);
    if (!expected) throw new Error(`Critical compatibility baseline is missing ${label}`);
    const actualPaths = record(actual.paths);
    const actualPath = Object.keys(actualPaths ?? {}).find((path) => path.replace(/\{[^}]+\}/g, "{}") === critical.path.replace(/\{[^}]+\}/g, "{}"));
    const operation = record(record(actualPaths?.[actualPath ?? critical.path])?.[critical.method]);
    if (!operation) { breaking.push(`${label}: endpoint or method removed`); continue; }
    const expectedParameters = parameters(baseline, expected);
    for (const parameter of parameters(actual, operation)) {
      if (parameter.required !== true) continue;
      const match = expectedParameters.find((item) => item.name === parameter.name && item.in === parameter.in);
      if (!match && parameter.in !== "path") breaking.push(`${label}: new required ${String(parameter.in)} parameter ${String(parameter.name)}`);
      else if (match) {
        const oldSchema = schema(baseline, match.schema); const newSchema = schema(actual, parameter.schema);
        if (oldSchema && newSchema && !compatibleType(oldSchema, newSchema)) breaking.push(`${label}: incompatible parameter ${String(parameter.name)}`);
      }
    }
    const newSecurity = operation.security ?? actual.security;
    if (Array.isArray(newSecurity) && newSecurity.length) {
      const schemes = record(record(actual.components)?.securitySchemes);
      let incomplete = false;
      const supported = newSecurity.some((choice) => {
        const required = record(choice);
        return required && Object.entries(required).every(([key, scopes]) => {
          const auth = record(schemes?.[key]);
          if (!auth) incomplete = true;
          return auth && !strings(scopes).length && (
            (auth.type === "apiKey" && auth.in === "header" && typeof auth.name === "string" && auth.name.toLowerCase() === "authorization") ||
            (auth.type === "http" && typeof auth.scheme === "string" && auth.scheme.toLowerCase() === "bearer")
          );
        });
      });
      if (!supported && incomplete) warnings.push(`${label}: authentication scheme metadata incomplete`);
      else if (!supported) breaking.push(`${label}: authentication requires an unsupported scheme or scope`);
    }
    // Compare consumed request/response fields, not complete DTO graphs or descriptions.
    for (const kind of ["request", "response"] as const) {
      const fields = critical[kind];
      if (!fields) continue;
      const oldRoot = kind === "request" ? jsonSchema(baseline, expected.requestBody) : responseSchema(baseline, expected);
      const newRoot = kind === "request" ? jsonSchema(actual, operation.requestBody) : responseSchema(actual, operation);
      if (!newRoot) {
        const successes = Object.keys(record(operation.responses) ?? {}).filter((code) => /^2\d\d$/.test(code));
        if (kind === "response" && successes.length && successes.every((code) => code === "204")) breaking.push(`${label}: no-content response replaces required response fields`);
        else warnings.push(`${label}: ${kind} schema unavailable or ambiguous`);
        continue;
      }
      if (kind === "request") {
        for (const required of strings(newRoot.required)) if (!critical.supplied?.includes(required)) breaking.push(`${label}: requires unsupplied body field ${required}`);
      }
      for (const name of fields) {
        const before = field(baseline, oldRoot, name); const after = field(actual, newRoot, name);
        if (after.state === "missing") breaking.push(`${label}: ${kind} field ${name} removed or its parent type changed`);
        else if (after.state === "unknown") warnings.push(`${label}: cannot verify ${kind} field ${name}`);
        else if (before.state === "known") {
          if (!compatibleType(before.schema, after.schema)) breaking.push(`${label}: ${kind} field ${name} has an incompatible type`);
          const oldValues = before.schema.enum; const newValues = after.schema.enum;
          if (kind === "request" && Array.isArray(oldValues) && Array.isArray(newValues) && oldValues.some((value) => !newValues.includes(value))) breaking.push(`${label}: ${kind} field ${name} no longer accepts supported values`);
        }
      }
    }
    const responses = record(operation.responses);
    if (responses) {
      const expectedSuccess = Object.keys(record(expected.responses) ?? {}).filter((code) => /^2\d\d$/.test(code));
      if (expectedSuccess.length && !Object.keys(responses).some((code) => /^2\d\d$/.test(code))) breaking.push(`${label}: expected success response removed`);
    }
    if (critical.path.endsWith("/status")) {
      const parameter = parameters(actual, operation).find((item) => item.name === "status" && item.in === "query");
      if (!parameter) breaking.push(`${label}: status query parameter removed`);
      const values = schema(actual, parameter?.schema)?.enum;
      if (Array.isArray(values) && (!values.includes(1) || !values.includes(2))) breaking.push(`${label}: start/complete status values are no longer accepted`);
    }
  }
  return { breaking, warnings: [...new Set(warnings)] };
}
