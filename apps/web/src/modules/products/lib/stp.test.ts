import { expect, it } from "vitest";
import { stpDocumentSchema, stpFormSchema } from "../schemas/stp-schema";
import { documentLocked, documentProblem, latestVersion, nextStpNumber } from "./stp";

const file = new File(["x"], "stp.docx");
const document = (status: number) => stpDocumentSchema.parse({ id: "d1", status, versions: [{ versionNumber: 1, fileName: "a.docx" }, { versionNumber: 2, fileName: "b.docx" }] });

it("numbers a new STP after the ones that exist", () => {
  expect(nextStpNumber(0)).toBe("QCD/STP/FP/001");
  expect(nextStpNumber(41)).toBe("QCD/STP/FP/042");
});

it("needs a document for a new STP and a reason to replace an approved one", () => {
  expect(documentProblem({ file: null, document: null, reasonForChange: "" })).toBe("Attach the STP as a .docx file");
  expect(documentProblem({ file, document: null, reasonForChange: "" })).toBeNull();
  expect(documentProblem({ file: null, document: document(1), reasonForChange: "" })).toBeNull();
  expect(documentProblem({ file, document: document(1), reasonForChange: "" })).toBe("A document under review cannot be replaced");
  expect(documentProblem({ file, document: document(2), reasonForChange: " " })).toBe("reason");
  expect(documentProblem({ file, document: document(2), reasonForChange: "New method" })).toBeNull();
  expect([0, 1, 2, 3].map(documentLocked)).toEqual([false, true, false, true]);
});

it("reads the newest version, and treats no document as none", () => {
  expect(latestVersion(document(0))?.fileName).toBe("b.docx");
  expect(stpDocumentSchema.parse(null)).toBeNull();
  expect(latestVersion(null)).toBeNull();
});

it("accepts only .docx files", () => {
  expect(stpFormSchema.safeParse({ stpNumber: "S-1", document: new File(["x"], "stp.pdf") }).success).toBe(false);
  expect(stpFormSchema.safeParse({ stpNumber: "S-1", document: new File(["x"], "STP.DOCX") }).success).toBe(true);
  expect(stpFormSchema.safeParse({ stpNumber: " " }).success).toBe(false);
});
