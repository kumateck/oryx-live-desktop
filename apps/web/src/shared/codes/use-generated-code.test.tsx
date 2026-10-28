// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { useGeneratedCode } from "./use-generated-code";
function Probe() {
  const code = useGeneratedCode("OvertimeRequest"); const [value, setValue] = useState("Manual code");
  return <><button disabled={!code.ready || code.busy} onClick={() => { void code.suggest().then((suggestion) => { if (suggestion) setValue(suggestion); }); }}>Suggest</button><p>{value}</p>{code.unavailable ? <p role="alert">Code suggestion unavailable</p> : null}</>;
}
function open(count: number, fails = false) {
  const backend = stubBackend(); const auth = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    return new URL(input.url).pathname.endsWith("/count") ? fails ? new Response(null, { status: 503 }) : Response.json(count)
      : Response.json({ namingType: 0, prefix: "OT", minimumNameLength: 3, maximumNameLength: 3 });
  });
  rememberSession(); render(<SessionProvider><ApiProvider><Probe /></ApiProvider></SessionProvider>);
}
afterEach(() => { cleanup(); forgetSession(); });
it("uses the real prefix count when suggesting a sequential request code", async () => {
  open(2); const user = userEvent.setup(); await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false)); await user.click(screen.getByRole("button"));
  await screen.findByText("OT003");
});
it.each(["unavailable", "overflow"] as const)("does not invent a zero count or wrap a sequential code when %s", async (kind) => {
  open(kind === "overflow" ? 999 : 0, kind === "unavailable"); const user = userEvent.setup();
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false)); await user.click(screen.getByRole("button"));
  await screen.findByRole("alert"); expect(screen.getByText("Manual code")).toBeTruthy(); expect(screen.queryByText("OT001")).toBeNull();
});
