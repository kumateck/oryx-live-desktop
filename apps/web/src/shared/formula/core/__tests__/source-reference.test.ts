import { describe, expect, it } from "vitest";

import { FormulaSourceType } from "../binding-contracts";
import {
  crossQuestionTableStatisticReference,
  crossQuestionValueReference,
  formulaResultReference,
  formulaResultReferenceParts,
  isValidSourceReference,
} from "../source-reference";

describe("formula source references", () => {
  it("builds stable encoded cross-question references", () => {
    expect(crossQuestionValueReference("assay:source 1")).toBe(
      "placement/assay%3Asource%201/value",
    );
    expect(crossQuestionTableStatisticReference("weights", 2)).toBe(
      "placement/weights/table/column/2",
    );
    expect(formulaResultReference("assay:source 1", "final result")).toBe(
      "placement/assay%3Asource%201/result/final%20result",
    );
  });

  it("rejects malformed and negative table references", () => {
    expect(
      isValidSourceReference(
        FormulaSourceType.QuestionValue,
        "placement/source/value",
      ),
    ).toBe(true);
    expect(
      isValidSourceReference(
        FormulaSourceType.QuestionValue,
        "question/source/value",
      ),
    ).toBe(false);
    expect(
      isValidSourceReference(
        FormulaSourceType.QuestionTableColumnStat,
        "placement/source/table/column/-1",
      ),
    ).toBe(false);
    expect(
      isValidSourceReference(
        FormulaSourceType.FormulaResult,
        "placement/assay/result/final",
      ),
    ).toBe(true);
    expect(
      isValidSourceReference(
        FormulaSourceType.FormulaResult,
        "formula/assay/final",
      ),
    ).toBe(false);
    expect(
      isValidSourceReference(
        FormulaSourceType.FormulaResult,
        "placement/%ZZ/result/final",
      ),
    ).toBe(false);
  });

  it("decodes formula-result identity for dependency verification", () => {
    expect(
      formulaResultReferenceParts(
        "placement/assay%3Asource%201/result/final%20result",
      ),
    ).toEqual({ placementKey: "assay:source 1", resultKey: "final result" });
    expect(
      formulaResultReferenceParts("placement/%ZZ/result/final"),
    ).toBeNull();
  });
});
