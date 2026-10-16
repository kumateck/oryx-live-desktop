// Cache tags for generated endpoints, derived from each endpoint's URL. See docs/api-codegen.md, "Cache tags".
//
// A resource is named by the first two literal segments of its path (`procurement/shipment-document`), its family by
// the first (`procurement`). Segments are singular, so `/warehouse/grns` and `/warehouse/grn/{id}` name one resource.
// - A query with no path parameter reads a list: it provides the resource's LIST and its family's LIST.
// - A query with a path parameter reads one record (or something belonging to it): it provides that record.
// - A mutation invalidates the resource's LIST, its family's LIST, and the record named by its path parameter.

export const LIST = "LIST";

export interface EndpointTags {
  /** The resource, e.g. `procurement/shipment-document`. */
  resource: string;
  /** The resource family, e.g. `procurement`. */
  family: string;
  /** The query argument holding the record's id, when the path names one. */
  idArg: string | null;
}

const param = /^\$\{queryArg(?:\.(\w+)|\["(\w+)"\])\}$/;
/** `batches` and `batch`, `countries` and `country` name one resource; `status` and `process` stay as they are. */
export function singular(segment: string): string {
  const lower = segment.toLowerCase();
  if (lower.length <= 3) return lower;
  if (lower.endsWith("ies")) return `${lower.slice(0, -3)}y`;
  if (/(ch|sh|x|ss)es$/.test(lower)) return lower.slice(0, -2);
  return lower.endsWith("s") && !lower.endsWith("ss") && !lower.endsWith("us") ? lower.slice(0, -1) : lower;
}

/** Reads the tags of an endpoint from its generated URL template, e.g. `/api/v1/warehouse/grn/${queryArg.id}`. */
export function endpointTags(url: string): EndpointTags {
  const segments = url.replace(/^\/api\/v\d+\//, "").split("/").filter(Boolean);
  const literals: string[] = [];
  let idArg: string | null = null;
  for (const segment of segments) {
    const match = param.exec(segment);
    if (match) { idArg = match[1] ?? match[2] ?? null; break; }
    if (segment.includes("${")) throw new Error(`Cannot read the path segment ${segment} of ${url}`);
    literals.push(singular(segment));
  }
  if (literals.length === 0) throw new Error(`${url} names no resource before its first parameter`);
  return { resource: literals.slice(0, 2).join("/"), family: literals[0] ?? "", idArg };
}

/** The `providesTags` or `invalidatesTags` property written into a generated endpoint. */
export function tagProperty(kind: "query" | "mutation", tags: EndpointTags): string {
  const lists = [...new Set([tags.resource, tags.family])].map((type) => `{ type: "${type}", id: "${LIST}" }`);
  const record = tags.idArg ? `{ type: "${tags.resource}", id: queryArg.${tags.idArg} }` : null;
  if (kind === "query") {
    return record ? `providesTags: (_result, _error, queryArg) => [${record}],` : `providesTags: [${lists.join(", ")}],`;
  }
  const all = [...lists, ...(record ? [record] : [])].join(", ");
  return record ? `invalidatesTags: (_result, error, queryArg) => (error ? [] : [${all}]),` : `invalidatesTags: (_result, error) => (error ? [] : [${all}]),`;
}

/**
 * Adds tags to every endpoint of a generated file and returns the file with the resource types it uses.
 * Fails if an endpoint's URL cannot be read, so no endpoint is ever left untagged.
 */
export function addCacheTags(source: string): { source: string; types: string[] } {
  const types = new Set<string>();
  let endpoints = 0;
  const tagged = source.replace(/(\n {4}(\w+): build\.(query|mutation)<[\s\S]*?>\(\{\n)( {6}query: \(queryArg\) => \(\{\n {8}url: `([^`]*)`)/g,
    (_match, head: string, _name: string, kind: "query" | "mutation", body: string, url: string) => {
      const tags = endpointTags(url);
      types.add(tags.resource);
      types.add(tags.family);
      endpoints += 1;
      return `${head}      ${tagProperty(kind, tags)}\n${body}`;
    });
  const declared = (source.match(/: build\.(query|mutation)</g) ?? []).length;
  if (endpoints !== declared) throw new Error(`Tagged ${endpoints} of ${declared} endpoints; the generated layout changed.`);
  return { source: tagged, types: [...types].sort() };
}
