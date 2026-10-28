import assert from "node:assert/strict";
import test from "node:test";
import { addCacheTags, endpointTags, singular, tagProperty } from "../scripts/api-cache-tags.ts";

test("a list and its records name one resource, singular, within a family", () => {
  assert.deepEqual(endpointTags("/api/v1/warehouse/grns"), { resource: "warehouse/grn", family: "warehouse", idArg: null });
  assert.deepEqual(endpointTags("/api/v1/warehouse/grn/${queryArg.id}"), { resource: "warehouse/grn", family: "warehouse", idArg: "id" });
  assert.deepEqual(endpointTags("/api/v1/procurement/shipment-document/${queryArg.shipmentDocumentId}/material-distribution"),
    { resource: "procurement/shipment-document", family: "procurement", idArg: "shipmentDocumentId" });
  assert.deepEqual(endpointTags("/api/v1/material/${queryArg.materialId}/batches-v2/${queryArg.departmentId}"), { resource: "material", family: "material", idArg: "materialId" });
  assert.deepEqual(endpointTags("/api/v1/user/${queryArg[\"module\"]}"), { resource: "user", family: "user", idArg: "module" });
  assert.equal(endpointTags("/api/v1/approval/process").resource, "approval/process");
  assert.throws(() => endpointTags("/api/v1/${queryArg.id}"));
});

test("queries provide lists or one record; mutations invalidate lists and the record they name, only on success", () => {
  const record = endpointTags("/api/v1/warehouse/grn/${queryArg.id}");
  const list = endpointTags("/api/v1/warehouse/grns");
  assert.equal(tagProperty("query", list), 'providesTags: [{ type: "warehouse/grn", id: "LIST" }, { type: "warehouse", id: "LIST" }],');
  assert.equal(tagProperty("query", record), 'providesTags: (_result, _error, queryArg) => [{ type: "warehouse/grn", id: queryArg.id }],');
  assert.equal(tagProperty("mutation", record),
    'invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse/grn", id: "LIST" }, { type: "warehouse", id: "LIST" }, { type: "warehouse/grn", id: queryArg.id }]),');
  assert.equal(tagProperty("mutation", endpointTags("/api/v1/material")), 'invalidatesTags: (_result, error) => (error ? [] : [{ type: "material", id: "LIST" }]),');
});

test("every generated endpoint is tagged, or generation fails", () => {
  const source = [
    "const injectedRtkApi = api.injectEndpoints({", "  endpoints: (build) => ({",
    "    getApiV1WarehouseGrnById: build.query<", "      GetApiV1WarehouseGrnByIdApiResponse,", "      GetApiV1WarehouseGrnByIdApiArg", "    >({",
    "      query: (queryArg) => ({", "        url: `/api/v1/warehouse/grn/${queryArg.id}`,", "      }),", "    }),",
    "    postApiV1WarehouseGrn: build.mutation<PostApiV1WarehouseGrnApiResponse, PostApiV1WarehouseGrnApiArg>({",
    "      query: (queryArg) => ({", "        url: `/api/v1/warehouse/grn`,", "        method: \"POST\",", "      }),", "    }),", "  }),", "});",
  ].join("\n");
  const { source: tagged, types } = addCacheTags(source);
  assert.deepEqual(types, ["warehouse", "warehouse/grn"]);
  assert.match(tagged, /providesTags: \(_result, _error, queryArg\) => \[\{ type: "warehouse\/grn", id: queryArg\.id \}\],\n {6}query:/);
  assert.match(tagged, /invalidatesTags: \(_result, error\) => \(error \? \[\] : \[\{ type: "warehouse\/grn", id: "LIST" \}, \{ type: "warehouse", id: "LIST" \}\]\),\n {6}query:/);
  assert.throws(() => addCacheTags(source.replace("      query: (queryArg) => ({\n        url: `/api/v1/warehouse/grn`", "      query: () => ({\n        url: `/api/v1/warehouse/grn`")));
});

test("plural path segments read as one singular resource", () => {
  assert.deepEqual(["batches", "batch", "countries", "status", "process", "grns", "analytical-tests", "boms", "fgtns"].map(singular),
    ["batch", "batch", "country", "status", "process", "grn", "analytical-test", "bom", "fgtn"]);
});

test("modules add to the generated tags and never replace them", async () => {
  const { readdir, readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const root = join(import.meta.dirname, "../apps/web/src");
  const files = (await readdir(root, { recursive: true })).filter((file) => /\.tsx?$/.test(file) && !file.includes("generated"));
  const replacing: string[] = [];
  for (const file of files) {
    const source = await readFile(join(root, file), "utf8");
    if (!source.includes("enhanceEndpoints")) continue;
    // In enhanceEndpoints, `name: { providesTags: … }` replaces the generated tags; `addTags` adds to them.
    for (const match of source.matchAll(/^\s+(\w+): \{[^}\n]*\b(providesTags|invalidatesTags)\s*:/gm)) replacing.push(`${file}: ${match[1]}`);
  }
  assert.deepEqual(replacing, []);
});
