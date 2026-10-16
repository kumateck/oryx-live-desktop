import { describe, expect, it } from "vitest";

import { FormulaScope } from "../../core";
import { buildFormulaRevisionDraft } from "../definition-adapter";

describe("formula variable scope", () => {
  it("preserves explicit form scope without changing legacy defaults", async () => {
    const draft = await buildFormulaRevisionDraft(
      JSON.stringify({
        expression: ":local+:external",
        variableScopes: { external: FormulaScope.Form },
      }),
      "Simple",
    );

    expect(
      Object.fromEntries(
        draft.definition.variables.map((item) => [item.key, item.scope]),
      ),
    ).toEqual({
      external: FormulaScope.Form,
      local: FormulaScope.Placement,
    });
  });
});
