import { historyParams } from "../lib/history";
import type { ApiDispatch } from "@/shared/api/api-provider";
import { identityApi } from "@/shared/api/generated/identity";
import type { DomainEntitiesDepartmentsDepartmentDto } from "@/shared/api/generated/identity";
import type { SelectPage } from "@/shared/forms/form-wizard-types";
import type { ReportFilters } from "../schemas/report-filters";
import { ReportKey, reportsAudit, type ReportDefinition } from "../lib/report-model";
import { reportSelection, selectedReportValue } from "../lib/selections";
import { reportContractApi, type SupplierMapping } from "./contract-adapters";
import { allReportPages } from "./all-pages";
import { reportRequest } from "./request";

export interface LookupRow { id?: string | null | undefined; name?: string | null | undefined; code?: string | null | undefined }
export function lookupPage(rows: readonly LookupRow[], search: string, page: number): SelectPage {
  const term=search.toLocaleLowerCase();
  const matches=rows.filter((row)=>`${row.name ?? ""} ${row.code ?? ""}`.toLocaleLowerCase().includes(term));
  return { options: matches.slice((page-1)*30,page*30).flatMap((row)=>row.id&&row.name ? [{ value:row.id, label:row.code?`${row.code} · ${row.name}`:row.name, name:row.name, ...(row.code?{code:row.code}:{}) }] : []), hasNext:matches.length>page*30, hasPrevious:page>1 };
}
export function eligibleReportDepartments(rows: readonly DomainEntitiesDepartmentsDepartmentDto[], definition: ReportDefinition, filters: ReportFilters) {
  if (definition.group==="hr") return rows;
  const owner=definition.key===ReportKey.MaterialList || definition.key===ReportKey.InventoryValuation;
  const selectedTypes=reportSelection(filters,"warehouseType").length?reportSelection(filters,"warehouseType"):reportSelection(filters,"materialKind");
  return rows.filter((department)=>owner ? (department.warehouses??[]).some((warehouse)=>
    (warehouse.type===0||warehouse.type===1) && (!selectedTypes.length||selectedTypes.some((option)=>option.value===String(warehouse.type)))) : department.type===0||department.type===2);
}
export async function reportDepartmentChoices(dispatch:ApiDispatch, definition:ReportDefinition, filters:ReportFilters, search:string, page:number, signal:AbortSignal) {
  const rows=await allReportPages((index)=>reportRequest(dispatch(identityApi.endpoints.getApiV1Department.initiate({ ...reportsAudit,...historyParams(filters),page:index,pageSize:100 },{subscribe:false})),signal),(row)=>row.id,signal);
  return lookupPage(eligibleReportDepartments(rows,definition,filters),search,page);
}
export function filterSupplierMappings(rows:readonly SupplierMapping[], filters:ReportFilters):SupplierMapping[] {
  return rows.filter((row)=>selectedReportValue(filters,"supplier",row.supplier?.id)&&selectedReportValue(filters,"manufacturer",row.manufacturers?.id))
    .map((row)=>({ ...row,materials:(row.materials??[]).filter((entry)=>selectedReportValue(filters,"materialKind",entry.material?.kind)&&selectedReportValue(filters,"material",entry.material?.id)) })).filter((row)=>row.materials.length>0);
}
export async function procurementChoices(dispatch:ApiDispatch, filters:ReportFilters, entity:"supplier"|"manufacturer"|"material", search:string, page:number, signal:AbortSignal) {
  const rows=await reportRequest(dispatch(reportContractApi.endpoints.readReportSupplierMappings.initiate(reportsAudit,{subscribe:false})),signal);
  const scope={...filters, supplier:entity==="supplier"?null:filters.supplier, manufacturer:entity==="material"?filters.manufacturer:null, material:null,
    selections:{...filters.selections,supplier:entity==="supplier"?[]:filters.selections.supplier,manufacturer:entity==="material"?filters.selections.manufacturer:[],material:[]} };
  const matching=filterSupplierMappings(rows,scope);
  const choices=entity==="material"?matching.flatMap((row)=>(row.materials??[]).flatMap((entry)=>entry.material?[entry.material]:[]))
    : matching.flatMap((row)=>{const party=entity==="supplier"?row.supplier:row.manufacturers;return party?[party]:[];});
  const unique=new Map(choices.flatMap((row)=>row.id?[[row.id,row] as const]:[]));
  return lookupPage([...unique.values()],search,page);
}
