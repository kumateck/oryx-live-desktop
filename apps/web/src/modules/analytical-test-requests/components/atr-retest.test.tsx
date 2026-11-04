// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { atrPermissions } from "../lib/atr";
import { atrSchema } from "../schemas/atr-schema";
import { CompleteAtrRetestDialog } from "./atr-dialogs";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

function open() {
  const backend = stubBackend({ permissions: [atrPermissions.completeRetest] });
  const session = backend.fetcher.getMockImplementation();
  const writes: URL[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    if (input.method === "POST") {
      writes.push(new URL(input.url));
      return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  });
  const close = vi.fn();
  const atr = atrSchema.parse({ id: "atr-1", status: 3, isRetest: true });
  function Dialog() {
    const user = useCurrentUser();
    return user ? <CompleteAtrRetestDialog atr={atr} onClose={close} /> : null;
  }
  rememberSession();
  render(<SessionProvider><ApiProvider><Dialog /></ApiProvider></SessionProvider>);
  return { writes, close };
}

it("requires a month and completes the product retest with its UTC month end", async () => {
  const user = userEvent.setup();
  const { writes, close } = open();
  await user.click(await screen.findByRole("button", { name: "Complete retest" }));
  expect(await screen.findByText("Choose the current month or a later month.")).toBeTruthy();
  expect(writes).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: /Extended expiry date/ }));
  expect(screen.queryByRole("grid")).toBeNull();
  await user.click(screen.getByRole("combobox", { name: "Year" }));
  await user.click(screen.getByRole("option", { name: "2028" }));
  await user.click(screen.getByRole("combobox", { name: "Month" }));
  await user.click(screen.getByRole("option", { name: "February" }));
  await user.click(screen.getByRole("button", { name: "Apply" }));
  await user.click(screen.getByRole("button", { name: "Complete retest" }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(writes).toHaveLength(1);
  expect(writes[0]?.searchParams.get("extendedExpiryDate")).toBe("2028-02-29T00:00:00.000Z");
});
