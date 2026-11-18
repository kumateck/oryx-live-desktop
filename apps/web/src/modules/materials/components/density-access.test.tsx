// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { LinkDialog } from "./link-dialog";

afterEach(() => { cleanup(); forgetSession(); });
it.each([0, 1] as const)("guards shared-density entry separately for material kind %s", async kind => {
  const linkKey = kind === 0 ? "CanLinkRawMaterials" : "CanLinkPackagingMaterials";
  const key = kind === 0 ? "CanEditRawMaterialDensity" : "CanEditPackagingMaterialDensity";
  for (const allowed of [false, true]) {
    const backend = stubBackend({ permissions: [linkKey, ...(allowed ? [key] : [])] });
    const session = backend.fetcher.getMockImplementation();
    backend.fetcher.mockImplementation(async (input, init) => {
      if (input instanceof Request && new URL(input.url).pathname === "/api/v1/collection")
        return Response.json({ UnitOfMeasure: [{ id: "u", symbol: "kg" }, { id: "d", symbol: "g/mL" }] });
      return session ? session(input, init) : new Response(null, { status: 404 });
    });
    rememberSession();
    const router = createMemoryRouter([{ path: "/", element: <LinkDialog material={{ id: "material", name: "Liquid", code: "M", kind }} onClose={() => {}} /> }]);
    render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
    await screen.findByRole("dialog");
    await screen.findByRole("combobox", { name: /Counted in/ });
    if (allowed) expect(await screen.findByRole("spinbutton", { name: "Density (g/mL)" })).toBeTruthy();
    else expect(screen.queryByRole("spinbutton", { name: "Density (g/mL)" })).toBeNull();
    cleanup(); forgetSession();
  }
});
