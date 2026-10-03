// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { forgetSession, testUserId } from "@/test/backend";
import { mountSettings, settingsBackend } from "@/modules/settings-support/testing";
import { useSaveSignature } from "./use-save-signature";
import { signatureBytes } from "../lib/signature-images";

afterEach(() => { cleanup(); forgetSession(); });
const drawing = "data:image/png;base64,iVBORw0KGgo=";
const path = `/api/v1/file/signature/${testUserId}.png`;
function SaveHarness() {
  const state = useSaveSignature(testUserId);
  const [saved, setSaved] = useState(false);
  return <><button disabled={state.busy} onClick={() => { void state.save({ mode: "draw", drawing, name: "", image: null }).then(setSaved); }}>Save signature</button>
    {state.error ? <p role="alert">{state.error}</p> : null}{saved ? <p>Verified save</p> : null}</>;
}
function open(match: boolean) {
  const calls = settingsBackend(["CanCreateSignatureSettings"], (request) => {
    const requestPath = new URL(request.url).pathname;
    if (request.method === "POST") return new Response(null, { status: 204 });
    if (requestPath === "/api/v1/user/authenticated") return Response.json({ id: testUserId, signature: `http://server.invalid${path}` });
    return new Response(match ? signatureBytes(drawing) : "previous-signature");
  });
  mountSettings(<SaveHarness />); return calls;
}
it("does not announce a save after a silent 204 failure", async () => {
  const calls = open(false); fireEvent.click(await screen.findByRole("button", { name: "Save signature" }));
  await screen.findByText(/did not confirm the new signature/);
  expect(screen.queryByText("Verified save")).toBeNull();
  expect(calls.find((call) => call.method === "POST")?.path).toBe(`/api/v1/user/signature/${testUserId}`);
});
it("confirms a save only after re-reading the profile and matching stored bytes", async () => {
  const calls = open(true); fireEvent.click(await screen.findByRole("button", { name: "Save signature" }));
  await screen.findByText("Verified save");
  expect(calls.map((call) => call.path)).toEqual([`/api/v1/user/signature/${testUserId}`, "/api/v1/user/authenticated", path]);
  expect(calls.every((call) => call.subModule === "Signature")).toBe(true);
});
