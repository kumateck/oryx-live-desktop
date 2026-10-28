import { strToU8, zipSync } from "fflate";

export function officeFixture(kind: "docx" | "xlsx", extra: Record<string, Uint8Array> = {}) {
  const main = kind === "docx" ? "word/document.xml" : "xl/workbook.xml";
  const type = kind === "docx" ? "wordprocessingml.document" : "spreadsheetml.sheet";
  return zipSync({
    "[Content_Types].xml": strToU8(`<Types><Override PartName="/${main}" ContentType="application/vnd.openxmlformats-officedocument.${type}.main+xml"/></Types>`),
    "_rels/.rels": strToU8(`<Relationships><Relationship Id="r0" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="${main}"/></Relationships>`),
    ...(kind === "docx" ? { "word/document.xml": strToU8('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Batch record</w:t></w:r></w:p></w:body></w:document>') }
      : { "xl/workbook.xml": strToU8('<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Results" sheetId="1" r:id="r1"/></sheets></workbook>'),
        "xl/_rels/workbook.xml.rels": strToU8('<Relationships><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
        "xl/worksheets/sheet1.xml": strToU8('<worksheet><sheetData><row r="1"><c r="A1"><v>25</v></c></row></sheetData></worksheet>') }),
    ...extra,
  });
}
