import { strToU8, zipSync } from "fflate";
import { expect, it } from "vitest";
import { detectKind, kindFromMime, kindFromName } from "./file-kind";
import { officeFixture } from "./preview-fixtures";
import { parseDelimited } from "./text-viewer";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pdf = strToU8("%PDF-1.7\n");

it("detects the real type from the bytes when the name has no extension", () => {
  expect(detectKind("Supplier certificate", null, pdf)).toBe("pdf");
  expect(detectKind("Label photo", null, png)).toBe("image");
  expect(detectKind("Batch record", null, officeFixture("docx"))).toBe("docx");
  expect(detectKind("Results", "application/octet-stream", officeFixture("xlsx"))).toBe("xlsx");
});

it("trusts the bytes over a misleading name", () => {
  expect(detectKind("scan.docx", null, pdf)).toBe("pdf");
  expect(detectKind("photo.pdf", null, png)).toBe("image");
  expect(detectKind("evidence.png", "image/png", strToU8("not really an image"))).toBe("text");
});

it("recognises formats the app cannot draw, so it can explain instead of failing", () => {
  expect(detectKind("old.doc", null, new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))).toBe("office-legacy");
  expect(detectKind("bundle", null, zipSync({ "a.txt": strToU8("a") }))).toBe("archive");
  expect(detectKind("deck", null, zipSync({ "ppt/presentation.xml": strToU8("<p/>") }))).toBe("office-other");
});

it("refines text into CSV, JSON and SVG", () => {
  expect(detectKind("readings.csv", null, strToU8("a,b\n1,2"))).toBe("csv");
  expect(detectKind("export", "text/csv", strToU8("a,b\n1,2"))).toBe("csv");
  expect(detectKind("payload", null, strToU8(' {"batch": 4862}'))).toBe("json");
  expect(detectKind("logo", null, strToU8('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe("image");
  expect(detectKind("notes", null, strToU8("Line clearance done."))).toBe("text");
});

it("falls back to the name, then the server's type, when the bytes say nothing", () => {
  const unknown = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
  expect(detectKind("clip.mp4", null, unknown)).toBe("video");
  expect(detectKind("clip", "audio/mpeg", unknown)).toBe("audio");
  expect(detectKind("clip", null, unknown)).toBe("unknown");
  expect(kindFromName("SCAN.JPEG")).toBe("image");
  expect(kindFromMime("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=binary")).toBe("xlsx");
});

it("parses quoted CSV fields, embedded delimiters, quotes and line breaks", () => {
  expect(parseDelimited('name,note\r\n"Smith, J","said ""ok""\nthen left"\n', ",")).toEqual([["name", "note"], ["Smith, J", 'said "ok"\nthen left']]);
  expect(parseDelimited("a\tb\n1\t2", "\t")).toEqual([["a", "b"], ["1", "2"]]);
  expect(parseDelimited("a\n1\n2\n3", ",", 2)).toHaveLength(2);
});
