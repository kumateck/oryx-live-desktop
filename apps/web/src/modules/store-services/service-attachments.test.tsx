// @vitest-environment jsdom
import { cleanup,render,screen,waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach,expect,it } from "vitest";
import { SessionProvider,useCurrentUser } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession,forgetSession,stubBackend } from "@/test/backend";
import { ServiceAttachments } from "./components/service-attachments";
import { service,serviceId,reference,fileId } from "./service-fixture";
function Ready() { const user=useCurrentUser();return user ? <ServiceAttachments row={service} /> : null; }
function open() {
 const backend=stubBackend({ permissions:["CanViewServices","CanEditService"] });const auth=backend.fetcher.getMockImplementation();const writes:string[]=[];
 backend.fetcher.mockImplementation(async (input,init) => {
  if (!(input instanceof Request)) return auth ? auth(input,init) : new Response(null,{ status:500 });
  if (input.method === "DELETE") { writes.push(new URL(input.url).pathname);return new Response(null,{ status:204 }); }
  return Response.json(service);
 });rememberSession();render(<SessionProvider><ApiProvider><Ready /></ApiProvider></SessionProvider>);return writes;
}
afterEach(() => { cleanup();forgetSession(); });
it("uses the stored attachment reference rather than its different record ID",async () => {
 const writes=open();const user=userEvent.setup();await user.click(await screen.findByRole("button",{ name:"Attachment actions for Certificate.pdf" }));
 await user.click(await screen.findByRole("menuitem",{ name:"Delete attachment" }));await user.click(await screen.findByRole("button",{ name:"Delete attachment" }));
 await waitFor(() => expect(writes).toHaveLength(1));expect(writes[0]).toBe(`/api/v1/file/${serviceId}/${reference}`);expect(writes[0]).not.toContain(fileId);
});
