import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useSession } from "@/shared/auth/session-provider";
import { rememberSession, stubBackend } from "@/test/backend";

export interface SettingsCall { path: string; query: string; method: string; body: string; module: string | null; subModule: string | null }
export function settingsBackend(permissions: string[], respond: (request: Request) => Response | Promise<Response>) {
  const backend = stubBackend({ permissions });
  const session = backend.fetcher.getMockImplementation();
  const calls: SettingsCall[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request) && !String(input).startsWith("/api/v1/file/signature/")) return session ? session(input, init) : new Response(null, { status: 500 });
    const request = input instanceof Request ? input : new Request(new URL(String(input), window.location.origin), init);
    const url = new URL(request.url);
    calls.push({ path: url.pathname, query: url.search, method: request.method, body: request.method === "GET" ? "" : await request.clone().text(), module: request.headers.get("Module"), subModule: request.headers.get("SubModule") });
    return respond(request);
  });
  return calls;
}
function Ready({ children }: { children: ReactNode }) {
  const { state } = useSession();
  return state.status === "authenticated" ? children : state.status === "anonymous" ? <p>Signed out</p> : null;
}
export function mountSettings(children: ReactNode, path = "/settings") {
  rememberSession();
  return render(<SessionProvider><ApiProvider><MemoryRouter initialEntries={[path]}><Ready>{children}</Ready></MemoryRouter></ApiProvider></SessionProvider>);
}
