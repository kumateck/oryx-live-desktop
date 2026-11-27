import { describe as group, expect, it } from "vitest";
import { calculateCfu, describe, evaluate, limitText, MicrobialLimitKind, readColonyCount, readDilution, readIncubation } from "./microbial-values";

group("microbial values", () => {
  it("reads the server's answer formats and refuses bad ones", () => {
    expect(readDilution('{"sample":10,"sampleUnit":"g","diluent":90,"factor":10}')).toEqual({ sample: 10, sampleUnit: "g", diluent: 90, factor: 10 });
    expect(readDilution('{"factor":0}')).toBeNull();
    expect(readColonyCount('{"plates":[12,-1]}')).toBeNull();
    expect(readIncubation('{"temperature":35,"hours":120}')).toBeNull();
  });
  it("calculates CFU as average count times dilution factor", () => {
    expect(calculateCfu({ plates: [12, 15], tooNumerousToCount: false }, { sample: null, sampleUnit: null, diluent: null, factor: 10 }, "cfu/mL").result).toBe(135);
  });
  it("describes answers for worksheets and prints", () => {
    expect(describe(15, "escherichia-coli")).toBe("Escherichia coli");
    expect(describe(16, '{"sample":10,"sampleUnit":"mL","diluent":90,"factor":10}')).toBe("10 mL in 90 mL · 1 in 10");
    expect(describe(17, '{"temperature":35,"hours":120,"startedAt":"2026-11-20T08:00:00Z"}')).toBe("35 °C for 120 h (in progress)");
    expect(describe(18, '{"plates":[12,15]}')).toBe("12 cfu, 15 cfu · average 13.5");
    expect(describe(19, '{"average":13.5,"factor":10,"result":135,"tooNumerousToCount":false,"unit":"cfu/g"}')).toBe("135 cfu/g");
  });
  it("prints and evaluates limits like the server", () => {
    const nmt = { formFieldId: "f", kind: MicrobialLimitKind.NotMoreThan, value: 1000, unit: "cfu/g", organism: null, quantity: null, quantityUnit: null };
    const absent = { formFieldId: "g", kind: MicrobialLimitKind.Absent, value: null, unit: null, organism: "escherichia-coli", quantity: 1, quantityUnit: "g" };
    expect(limitText(nmt)).toBe("NMT 1000 cfu/g");
    expect(limitText(absent)).toBe("Absence of Escherichia coli in 1 g");
    expect(evaluate(nmt, '{"factor":10,"result":1350,"unit":"cfu/g"}')).toBe("does-not-comply");
    expect(evaluate(nmt, '{"factor":10,"result":900,"unit":"cfu/g"}')).toBe("complies");
    expect(evaluate(nmt, '{"factor":10,"result":900,"unit":"cfu/mL"}')).toBe("unresolved");
    expect(evaluate(absent, "Absent")).toBe("complies");
    expect(evaluate(absent, null)).toBe("unresolved");
  });
});
