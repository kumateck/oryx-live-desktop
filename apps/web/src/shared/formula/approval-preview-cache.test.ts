// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { formsApi } from "@/shared/api/generated/forms";
import { api } from "@/shared/api/base-api";
import { governanceApi } from "./governance-api";

afterEach(() => vi.unstubAllGlobals());

it("refreshes the question library after successful approval and keeps it on refused approval", async () => {
  let libraryReads = 0;
  let refuse = true;
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input) => {
    if (!(input instanceof Request)) throw new Error("Expected an API request");
    if (new URL(input.url).pathname === "/api/v1/form/question") {
      libraryReads += 1;
      return Response.json({ data: [] });
    }
    return refuse ? Response.json({ errors: [{ code: "Conflict", description: "Changed revision" }] }, { status: 409 })
      : Response.json({
        id: "r1", questionId: "q1", revision: 1, definitionHash: "hash", status: 2, definition: {},
      });
  }));
  const store = configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (defaults) => defaults().concat(api.middleware) });
  const subscription = store.dispatch(formsApi.endpoints.getApiV1FormQuestion.initiate({ module: "Settings", subModule: "Questions" }));
  const approval = { module: "QualityAssurance", subModule: "Formula", questionId: "q1", revisionId: "r1", body: { expectedDefinitionHash: "hash", reason: "Checked and approved for use." } };
  try {
    await subscription.unwrap();
    await store.dispatch(governanceApi.endpoints.approveFormulaRevision.initiate(approval));
    expect(libraryReads).toBe(1);
    refuse = false;
    await store.dispatch(governanceApi.endpoints.approveFormulaRevision.initiate(approval)).unwrap();
    await waitFor(() => expect(libraryReads).toBe(2), { timeout: 1000 });
  } finally {
    subscription.unsubscribe();
    store.dispatch(api.util.resetApiState());
  }
});
