import { describe, expect, it } from "vitest";
import { buildCoaCompliancePayload } from "./coa-compliance";
import { certificateComment } from "../certificate-preview";
import { coaSections } from "./coa-sections";
import type { FormResponseDto, FormSectionDto } from "../dto";

// The Paracetamol 120mg Syrup microbial ARD: TAMC, TYMC and E. coli print; media verification, equipment and the conclusion do not.
const section = (id: string, name: string, description: string, fields: string[]): FormSectionDto => ({ id, name, description, fields: fields.map((field) => ({ id: field, question: { type: 0 } })) });
const sections = [
  section("media", "Culture media verification", "Growth promotion passes", ["media-result"]),
  section("tamc", "TAMC", "NMT 200 cfu/mL", ["tamc-result"]),
  section("tymc", "TYMC", "NMT 20 cfu/mL", ["tymc-result", "tymc-note"]),
  section("coli", "E. coli", "Absent", ["coli-result"]),
  section("equipment", "Equipment and reagents", "As listed", ["equipment-list"]),
  section("conclusion", "Conclusion", "Complies", ["conclusion-text"]),
];
const answer = (field: string, value: string): FormResponseDto => ({ id: `${field}-answer`, value, formField: { id: field, question: { type: 0 } } });
const responses = [answer("media-result", ""), answer("tamc-result", "10 cfu/mL"), answer("tymc-result", "5 cfu/mL"), answer("tymc-note", "plates read at 5 days"),
  answer("coli-result", "Absent"), answer("equipment-list", "Incubator 3"), answer("conclusion-text", "")];
const hidden = ["media-result", "tymc-note", "equipment-list", "conclusion-text"];

describe("certificate tests", () => {
  it("leaves off sections with no reported test and unreported fields of a kept section", () => {
    const kept = coaSections(sections, hidden);
    expect(kept.map((item) => item.id)).toEqual(["tamc", "tymc", "coli"]);
    expect(kept[1]?.fields?.map((field) => field.id)).toEqual(["tymc-result"]);
  });
  it("keeps every section when nothing is hidden", () => {
    expect(coaSections(sections, [])).toHaveLength(6);
    expect(coaSections(sections, undefined)).toHaveLength(6);
  });
  it("does not let an unreported test fail the conclusion or ask for review", () => {
    const everything = buildCoaCompliancePayload(sections, responses);
    expect(everything.some((item) => item.requiresReview)).toBe(true);
    const reported = buildCoaCompliancePayload(coaSections(sections, hidden), responses);
    expect(reported.map((item) => item.formSectionId)).toEqual(["tamc", "tymc", "coli"]);
    expect(reported.every((item) => item.complies && !item.requiresReview)).toBe(true);
    expect(certificateComment(reported, "Product")).toBe("Product complies with In-House specification.");
  });
});
