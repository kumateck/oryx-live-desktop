// Pure classification of OpenAPI operations for strict hook generation.
export interface JsonSchema {
  $ref?: string;
  type?: string;
  enum?: readonly JsonLiteral[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  allOf?: readonly JsonSchema[];
  oneOf?: readonly JsonSchema[];
  anyOf?: readonly JsonSchema[];
}
type JsonLiteral = string | number | boolean | null;
interface MediaType { schema?: JsonSchema }
interface Body { content?: Record<string, MediaType> }
export interface Operation {
  tags?: readonly string[];
  parameters?: readonly { name: string; schema?: JsonSchema }[];
  requestBody?: Body;
  responses: Record<string, Body>;
}
export interface Contract {
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, JsonSchema> };
}

// ProblemDetails.Extensions is arbitrary JSON by design; the generator maps it to JsonValue.
const arbitraryJsonSchemas = new Set(["Microsoft.AspNetCore.Mvc.ProblemDetails"]);
const verbs = new Set(["get", "put", "post", "delete", "patch"]);

export function createContractInspector(contract: Contract) {
  const schemas = contract.components.schemas;
  const refName = (ref: string) => ref.replace("#/components/schemas/", "");

  /** Checks one schema without following references; referenced names are collected instead. */
  function localGap(schema: JsonSchema | undefined, at: string, refs: Set<string>): string | null {
    if (!schema) return `${at} has no schema`;
    if (schema.$ref) { refs.add(refName(schema.$ref)); return null; }
    const composed = [...(schema.allOf ?? []), ...(schema.oneOf ?? []), ...(schema.anyOf ?? [])];
    for (const [index, part] of composed.entries()) {
      const gap = localGap(part, `${at}[${index}]`, refs);
      if (gap) return gap;
    }
    if (schema.additionalProperties === true) return `${at} allows untyped additional properties`;
    if (typeof schema.additionalProperties === "object") {
      const gap = localGap(schema.additionalProperties, `${at}.*`, refs);
      if (gap) return gap;
    }
    if (schema.items) return localGap(schema.items, `${at}[]`, refs);
    if (schema.type === "array") return `${at} is an array without an item type`;
    for (const [name, property] of Object.entries(schema.properties ?? {})) {
      const gap = localGap(property, `${at}.${name}`, refs);
      if (gap) return gap;
    }
    if (!schema.type && !schema.enum && !schema.properties && composed.length === 0 &&
        typeof schema.additionalProperties !== "object") return `${at} has no declared type`;
    return null;
  }

  // A named schema is untyped when it, or any schema it can reach, has a local gap.
  // Gaps are propagated backwards over references so cyclic DTO graphs are handled once.
  const named = new Map<string, string | null>();
  const referrers = new Map<string, string[]>();
  for (const [name, schema] of Object.entries(schemas)) {
    const refs = new Set<string>();
    named.set(name, arbitraryJsonSchemas.has(name) ? null : localGap(schema, name, refs));
    if (!arbitraryJsonSchemas.has(name)) for (const ref of refs) referrers.set(ref, [...(referrers.get(ref) ?? []), name]);
  }
  const pending = [...named].flatMap(([name, gap]) => gap ? [name] : []);
  for (let name = pending.pop(); name !== undefined; name = pending.pop()) {
    for (const referrer of referrers.get(name) ?? []) {
      if (named.get(referrer)) continue;
      named.set(referrer, named.get(name) ?? null);
      pending.push(referrer);
    }
  }

  function schemaGap(schema: JsonSchema | undefined, at: string): string | null {
    const refs = new Set<string>();
    const gap = localGap(schema, at, refs);
    if (gap) return gap;
    for (const ref of refs) {
      if (!named.has(ref)) return `${at} references missing schema ${ref}`;
      const referenced = named.get(ref);
      if (referenced) return referenced;
    }
    return null;
  }

  function bodyGap(body: Body | undefined, at: string): string | null {
    for (const [mediaType, media] of Object.entries(body?.content ?? {})) {
      const gap = schemaGap(media.schema, `${at} (${mediaType})`);
      if (gap) return gap;
    }
    return null;
  }

  /** Returns why an operation cannot produce a strictly typed hook, or null when it can. */
  function operationGap(operation: Operation): string | null {
    const success = Object.entries(operation.responses).filter(([status]) => status.startsWith("2"));
    if (success.length === 0) return "no success response is declared";
    for (const [status, response] of success) {
      const hasBody = Object.keys(response.content ?? {}).length > 0;
      if (!hasBody && status !== "204") return `${status} response has no declared body type`;
      const gap = bodyGap(response, `${status} response`);
      if (gap) return gap;
    }
    for (const parameter of operation.parameters ?? []) {
      const gap = schemaGap(parameter.schema, `parameter ${parameter.name}`);
      if (gap) return gap;
    }
    return bodyGap(operation.requestBody, "request body");
  }

  function operations(): { verb: string; path: string; operation: Operation }[] {
    return Object.entries(contract.paths).flatMap(([path, item]) => Object.entries(item)
      .filter(([verb]) => verbs.has(verb))
      .map(([verb, operation]) => ({ verb, path, operation })));
  }

  return { operationGap, operations };
}

/** An operation is generated once, into the domain that owns its first tag. */
export function owningTag(operation: Operation): string | null {
  return operation.tags?.[0] ?? null;
}
