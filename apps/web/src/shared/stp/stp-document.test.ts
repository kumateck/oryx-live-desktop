import { describe, expect, it } from "vitest";
import { createdIds, documentProblem, stpDocumentSchema, stpNumber, type StpDocument } from "./stp-document";

const doc = (status: number): StpDocument => stpDocumentSchema.parse({ id: "d1", status, versions: [{ id: "v1", versionNumber: 1 }, { id: "v2", versionNumber: 2 }] }) as StpDocument;
const file = (name: string) => new File(["x"], name);

describe("stp documents", () => {
  it("lists versions newest first and reads no document as null", () => {
    expect(doc(0).versions.map((version) => version.id)).toEqual(["v2", "v1"]);
    expect(stpDocumentSchema.parse(null)).toBeNull();
  });
  it("requires a first document, refuses replacement under review, and asks why an approved one changes", () => {
    expect(documentProblem({ file: null, document: null, reasonForChange: "" })).toMatch(/Attach/);
    expect(documentProblem({ file: file("a.pdf"), document: null, reasonForChange: "" })).toMatch(/docx/);
    expect(documentProblem({ file: file("a.docx"), document: doc(1), reasonForChange: "" })).toMatch(/under review/);
    expect(documentProblem({ file: file("a.docx"), document: doc(2), reasonForChange: "" })).toMatch(/reason/);
    expect(documentProblem({ file: file("a.docx"), document: doc(2), reasonForChange: "New limits" })).toBeNull();
    expect(documentProblem({ file: null, document: doc(1), reasonForChange: "" })).toBeNull();
  });
  it("numbers STPs and reads created ids in every shape the server sends", () => {
    expect(stpNumber("QCD/STP/PM", 4)).toBe("QCD/STP/PM/004");
    expect(createdIds([{ materialId: "m1", stpId: "s1" }, { materialId: "m2", stpId: "s2" }, { stpId: "s1" }])).toEqual(["s1", "s2"]);
    expect(createdIds("s9")).toEqual(["s9"]);
    expect(createdIds({ data: { id: "s3" } })).toEqual(["s3"]);
    expect(createdIds(null)).toEqual([]);
  });
});
