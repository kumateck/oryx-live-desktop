// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, expect, it } from "vitest";
import { materialSpecificationsApi } from "@/modules/material-specifications/api/material-specifications-api";
import { productSpecificationsApi } from "@/modules/product-specifications/api/product-specifications-api";
import { api } from "@/shared/api/base-api";
import { forgetSession, stubBackend } from "@/test/backend";

const body = {
  specificationNumber: "SPC/001",
  revisionNumber: "02",
  supersedesNumber: "None",
  effectiveDate: "2026-01-01",
  reviewDate: "2027-01-01",
  formId: "template",
};

afterEach(forgetSession);

it.each(["material", "product"] as const)("refreshes all affected %s specification details after an edit", async (kind) => {
  let revision = "01";
  let unrelatedReads = 0;
  const backend = stubBackend();
  backend.fetcher.mockImplementation(async (input) => {
    if (!(input instanceof Request)) return new Response(null, { status: 500 });
    if (input.method === "PUT") {
      revision = body.revisionNumber;
      return Response.json([{ specificationId: "edited" }, { specificationId: "linked" }]);
    }
    const id = new URL(input.url).pathname.split("/").at(-1);
    if (id === "unrelated") unrelatedReads += 1;
    return Response.json({ id, revisionNumber: id === "unrelated" ? "01" : revision });
  });
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (defaults) => defaults().concat(api.middleware),
  });
  const detail = kind === "material"
    ? materialSpecificationsApi.endpoints.getApiV1MaterialSpecificationsById
    : productSpecificationsApi.endpoints.getApiV1ProductSpecificationsById;
  const read = (id: string) => store.dispatch(detail.initiate({ id }, { subscribe: false })).unwrap();

  try {
    await Promise.all([read("edited"), read("linked"), read("unrelated")]);
    if (kind === "material") {
      await store.dispatch(materialSpecificationsApi.endpoints.putApiV1MaterialSpecificationsById.initiate({
        id: "edited", domainEntitiesMaterialSpecificationsUpdateMaterialSpecificationRequest: body,
      })).unwrap();
    } else {
      await store.dispatch(productSpecificationsApi.endpoints.putApiV1ProductSpecificationsById.initiate({
        id: "edited", domainEntitiesProductSpecificationsUpdateProductSpecificationRequest: { ...body, testStage: 2 },
      })).unwrap();
    }

    const [edited, linked, unrelated] = await Promise.all([read("edited"), read("linked"), read("unrelated")]);
    expect(edited.revisionNumber).toBe("02");
    expect(linked.revisionNumber).toBe("02");
    expect(unrelated.revisionNumber).toBe("01");
    expect(unrelatedReads).toBe(1);
  } finally {
    store.dispatch(api.util.resetApiState());
  }
});
