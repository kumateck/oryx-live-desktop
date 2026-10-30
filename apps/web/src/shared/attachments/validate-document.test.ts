import { expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { officeFixture } from "./preview-fixtures";
import { validateDocument } from "./validate-document";
import { attachmentAddress, documentFormat, safeFileLink } from "./file-type";
import { readBounded } from "./read-file";

it("recognizes document formats without weakening link safety, and preserves signed MinIO URLs", () => {
  for (const name of ["file.PDF", "file.docx", "file.xlsx"]) expect(documentFormat({ id: "1", name, link: "https://minio.example/a" })).not.toBeNull();
  expect(documentFormat({ id: "1", name: "Attachment", link: "https://minio.example/b/a.xlsx?X-Amz-Signature=keep" })).toBe("xlsx");
  for (const link of ["javascript:alert(1)", "data:text/html,a", "file:///etc/passwd", "https://u:secret@host/file", "https://"]) expect(safeFileLink(link)).toBeNull();
  const signed = "https://minio.example/b/a.docx?X-Amz-Signature=keep&X-Amz-Expires=60";
  expect(attachmentAddress(signed)).toBe(signed);
  expect(attachmentAddress("http://api.example:8086/api/v1/file/orders/id/ref")).toBe("/api/v1/file/orders/id/ref");
});

it("validates real document bytes without modifying originals, including a two-page PDF", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText("Certificate of analysis", { font });
  pdf.addPage().drawText("Approved batch evidence", { font });
  const bytes = await pdf.save();
  const before = bytes.slice();
  await validateDocument(bytes, "pdf");
  expect(bytes).toEqual(before);
  await validateDocument(officeFixture("docx"), "docx");
  await validateDocument(officeFixture("xlsx"), "xlsx");
});

it("rejects format confusion, malformed XML, executable content, external data and unsafe ZIP paths", async () => {
  await expect(validateDocument(officeFixture("docx"), "xlsx")).rejects.toThrow();
  await expect(validateDocument(strToU8("not a PDF"), "pdf")).rejects.toThrow();
  await expect(validateDocument(officeFixture("docx", { "word/document.xml": strToU8('<!DOCTYPE a [<!ENTITY x SYSTEM "https://external.invalid">]><a>&x;</a>') }), "docx")).rejects.toThrow();
  await expect(validateDocument(officeFixture("xlsx", { "xl/vbaProject.bin": new Uint8Array([1]) }), "xlsx")).rejects.toThrow();
  await expect(validateDocument(officeFixture("xlsx", { "xl/connections.xml": strToU8("<connections/>") }), "xlsx")).rejects.toThrow();
  await expect(validateDocument(officeFixture("docx", { "../escape.xml": strToU8("<a/>") }), "docx")).rejects.toThrow();
  await expect(validateDocument(officeFixture("docx", { "word/_rels/document.xml.rels": strToU8('<Relationships><Relationship Id="x" Type="image" Target="https://external.invalid" TargetMode="External"/></Relationships>') }), "docx")).rejects.toThrow();
});

it("enforces package and streaming limits even if the server omits or lies about content length", async () => {
  await expect(validateDocument(new Uint8Array(20 * 1024 * 1024 + 1), "pdf")).rejects.toThrow(/20 MB/);
  await expect(validateDocument(zipSync({ "large": new Uint8Array(65 * 1024 * 1024) }), "docx")).rejects.toThrow();
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(3)); controller.enqueue(new Uint8Array(3)); controller.close(); } });
  await expect(readBounded(new Response(stream, { headers: { "Content-Length": "1" } }), 5)).rejects.toThrow(/size limit/);
  await expect(readBounded(new Response(null, { status: 204 }), 100)).rejects.toThrow(/expired/);
  await expect(readBounded(new Response("refused", { status: 403 }), 100)).rejects.toThrow(/access/);
});
