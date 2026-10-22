// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { ItemAttachments } from "./components/item-attachments";
import { item, id, unitId, otherId } from "./fixture";
const row = { ...item, attachments: [{ id: unitId, reference: otherId, name: "Manual.pdf", link: `http://example.invalid/files/${otherId}` }] };
function Ready() {
  const user = useCurrentUser();
  return user ? <ItemAttachments row={row} /> : null;
}
afterEach(() => {
  cleanup();
  forgetSession();
});
it("opens files through the shared viewer controls and removes by stored reference, not record ID", async () => {
  const backend = stubBackend({ permissions: ["CanViewItemsInItStore", "CanEditItemInItStore"] });
  const auth = backend.fetcher.getMockImplementation();
  const writes: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    if (input.method === "DELETE") {
      writes.push(new URL(input.url).pathname);
      return new Response(null, { status: 204 });
    }
    return Response.json(row);
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Ready />
      </ApiProvider>
    </SessionProvider>,
  );
  const user = userEvent.setup();
  await screen.findByRole("button", { name: "View Manual.pdf" });
  await user.click(await screen.findByRole("button", { name: "Attachment actions for Manual.pdf" }));
  await user.click(await screen.findByRole("menuitem", { name: "Delete attachment" }));
  await user.click(await screen.findByRole("button", { name: "Delete attachment" }));
  await waitFor(() => expect(writes).toEqual([`/api/v1/file/${id}/${otherId}`]));
});
