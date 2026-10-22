import Excel from "exceljs";
import { expect,it,vi } from "vitest";
import { previewShiftWorkbook } from "./workbook";
vi.mock("@/shared/attachments/validation-client",() => ({ validateInWorker:async (bytes:ArrayBuffer) => bytes }));
async function book(rows:(string|number|{ formula:string;result:string })[][],headers=["STAFF ID","CATEGORY","SHIFT TYPE"]):Promise<File> {
 const workbook=new Excel.Workbook();const sheet=workbook.addWorksheet("Shifts");sheet.addRow(headers);for (const row of rows) sheet.addRow(row);
 const bytes=await workbook.xlsx.writeBuffer();return new File([bytes],"shifts.xlsx");
}
const signal=() => new AbortController().signal;
it("preserves leading zeros and previews the actual first worksheet with all columns",async () => {
 const result=await previewShiftWorkbook(await book([["0001","A","Day","Note"]],["STAFF ID","CATEGORY","SHIFT TYPE","NOTES"]),signal());
 expect(result.rows).toEqual([{ number:2,staff:"0001",category:"A",type:"Day" }]);expect(result.sheet.rows[0]?.cells).toEqual(["0001","A","Day","Note"]);
});
it.each(["missing","formula","duplicate","header"] as const)("refuses %s before upload",async (kind) => {
 const rows:(string|number|{ formula:string;result:string })[][]=[["0001","A","Day"]];let headers=["STAFF ID","CATEGORY","SHIFT TYPE"];
 if (kind === "missing") rows[0]=["0001","","Day"];
 if (kind === "formula") rows[0]=[{ formula:'"0001"',result:"0001" },"A","Day"];
 if (kind === "duplicate") rows.push(["0001","B","Night"]);
 if (kind === "header") headers=["STAFF ID","STAFF ID","SHIFT TYPE"];
 await expect(previewShiftWorkbook(await book(rows,headers),signal())).rejects.toBeInstanceOf(Error);
});
it("refuses legacy files instead of pretending the XLSX engine reads XLS",async () => {
 await expect(previewShiftWorkbook(new File(["legacy"],"shift.xls"),signal())).rejects.toThrow(/XLSX/);
});
