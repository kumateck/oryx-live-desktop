import { unzipSync } from "fflate";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { PDFDocument } from "pdf-lib";
import { z } from "zod";
import { attachmentLimit } from "./file-type";
import type { DocumentFormat } from "./engines";

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, processEntities: false,
  isArray: (name) => ["Relationship", "Override", "sheet"].includes(name) });
const linksSchema = z.object({ Relationships: z.object({ Relationship: z.array(z.object({
  "@_Id": z.string().optional(), "@_Type": z.string(), "@_Target": z.string(), "@_TargetMode": z.string().optional(),
})).default([]) }).or(z.literal("")) });
const typesSchema = z.object({ Types: z.object({ Override: z.array(z.object({ "@_PartName": z.string(), "@_ContentType": z.string() })) }) });
const invalid = () => new Error("This file is damaged, encrypted, or does not match its document type. Ask the sender to check the file.");
const unsupported = () => new Error("This document contains features the preview cannot safely open. These features are not supported.");

export async function validateDocument(bytes: Uint8Array, format: DocumentFormat): Promise<void> {
  if (!bytes.length || bytes.length > attachmentLimit) throw new Error("The preview supports files up to 16 MiB.");
  if (format === "pdf") {
    if (!new TextDecoder().decode(bytes.subarray(0, 1024)).includes("%PDF-")) throw invalid();
    try {
      const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
      if (pdf.isEncrypted || pdf.getPageCount() > 500 || pdf.context.enumerateIndirectObjects().length > 30_000) throw unsupported();
    } catch { throw invalid(); }
    return;
  }
  validateOffice(bytes, format);
}

/** Validation follows Dodo's bounded OOXML package boundary, without rewriting or saving any part. */
function validateOffice(bytes: Uint8Array, format: Exclude<DocumentFormat, "pdf">) {
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw invalid();
  let expanded = 0;
  const names = new Set<string>();
  const parts = unzipSync(bytes, { filter: (file) => {
    expanded += file.originalSize;
    if (expanded > 64 * 1024 * 1024 || names.size >= 2000 || names.has(file.name) || /(^\/|(^|\/)\.\.(\/|$)|\\)/.test(file.name)) throw unsupported();
    names.add(file.name);
    return true;
  } });
  const main = format === "docx" ? "word/document.xml" : "xl/workbook.xml";
  if (!parts[main] || !parts["[Content_Types].xml"] || !parts["_rels/.rels"] || parts[format === "docx" ? "xl/workbook.xml" : "word/document.xml"]) throw invalid();
  const texts = new Map<string, string>();
  let cells = 0;
  for (const [name, part] of Object.entries(parts)) {
    if (/vbaProject|activeX|embeddings\/|^xl\/(externalLinks|queryTables|connections|macrosheets)/i.test(name)) throw unsupported();
    if (!/\.(xml|rels)$/i.test(name)) continue;
    const text = new TextDecoder("utf-8", { fatal: true }).decode(part);
    if (/<!DOCTYPE|<!ENTITY/i.test(text) || XMLValidator.validate(text) !== true) throw invalid();
    texts.set(name, text);
    if (/^xl\/worksheets\//.test(name)) cells += [...text.matchAll(/<(?:[\w]+:)?c[\s>]/g)].length;
    if (cells > 250_000) throw unsupported();
    if (name.endsWith(".rels")) {
      const links = linksSchema.parse(parser.parse(text)).Relationships;
      if (links) for (const link of links.Relationship) {
        if ((link["@_TargetMode"] === "External" && !link["@_Type"].endsWith("/hyperlink")) || /vba|oleObject|activeX|attachedTemplate|externalLink/i.test(link["@_Type"])) throw unsupported();
      }
    }
  }
  const types = typesSchema.parse(parser.parse(texts.get("[Content_Types].xml") ?? "")).Types.Override;
  const wanted = format === "docx" ? "wordprocessingml.document" : "spreadsheetml.sheet";
  if (!types.some((type) => type["@_PartName"] === `/${main}` && type["@_ContentType"] === `application/vnd.openxmlformats-officedocument.${wanted}.main+xml`)) throw invalid();
  if (types.some((type) => /macroEnabled|vbaProject|oleObject|activeX/i.test(type["@_ContentType"]))) throw unsupported();
  const roots = linksSchema.parse(parser.parse(texts.get("_rels/.rels") ?? "")).Relationships;
  if (!roots || !roots.Relationship.some((link) => link["@_Type"].endsWith("/officeDocument") && link["@_Target"].replace(/^\//, "") === main && !link["@_TargetMode"])) throw invalid();
  if (format === "docx") z.object({ document: z.object({ body: z.string().or(z.looseObject({})) }) }).parse(parser.parse(texts.get(main) ?? ""));
  if (format === "xlsx") {
    const book = z.object({ workbook: z.object({ sheets: z.object({ sheet: z.array(z.object({ "@_name": z.string(), "@_id": z.string() })).min(1).max(64) }) }) }).parse(parser.parse(texts.get(main) ?? ""));
    const links = linksSchema.parse(parser.parse(texts.get("xl/_rels/workbook.xml.rels") ?? "")).Relationships;
    for (const sheet of book.workbook.sheets.sheet) {
      const link = links && links.Relationship.find((item) => item["@_Id"] === sheet["@_id"] && item["@_Type"].endsWith("/worksheet") && !item["@_TargetMode"]);
      const target = link ? link["@_Target"].startsWith("/") ? link["@_Target"].slice(1) : `xl/${link["@_Target"]}` : "";
      if (!/^xl\/worksheets\/[^/]+\.xml$/.test(target) || !parts[target]) throw invalid();
    }
  }
}
