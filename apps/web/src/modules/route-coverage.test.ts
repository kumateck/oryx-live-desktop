import { describe, expect, it } from "vitest";
import { modules } from "./registry";
import { routeAccessPolicy } from "./registry-model";

const pages = Object.keys(import.meta.glob("../pages/**/page.tsx"))
  .filter((file) => file.startsWith("../pages/(workspace)/") && !file.includes("[...rest]"));

describe("workspace route permission coverage", () => {
  it("discovers the protected route files", () => { expect(pages.length).toBeGreaterThan(0); });
  for (const page of pages) {
    const path = page.replace("../pages/(workspace)", "").replace("/page.tsx", "").replace(/\[([^\]]+)\]/g, ":$1");
    it(`declares an access policy for ${path}`, () => {
      expect(routeAccessPolicy(modules, path), `${page} needs a module access declaration`).not.toBeNull();
    });
  }
});
