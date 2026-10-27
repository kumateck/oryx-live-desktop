import { historyParams } from "../lib/history";
import { reportsApi } from "@/shared/api/generated/reports";
import type { ApiDispatch } from "@/shared/api/api-provider";
import type { ReportFilters } from "../schemas/report-filters";
import { reportsAudit } from "../lib/report-model";
import { reportSelection, selectedReportValue, singleReportFilters } from "../lib/selections";
import { fourChoice } from "../lib/filter-params";
import { reportRequest } from "./request";

/** Summary endpoints omit item IDs, so verify store/code identity before applying catalog filters. */
export async function filterStoreSelection<T extends {store?:number|null|undefined;itemCode?:string|null|undefined}>(dispatch:ApiDispatch, rows:T[], filters:ReportFilters, signal:AbortSignal):Promise<T[]> {
  const scoped=rows.filter((row)=>selectedReportValue(filters,"store",row.store));
  if (!( ["category","item","classification"] as const).some((name)=>reportSelection(filters,name).length>0)) return scoped;
  const query=singleReportFilters(filters); const store=fourChoice(query.store?.value);
  const items=await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportItemsPerStoreType.initiate({...reportsAudit, ...historyParams(filters),...(store===undefined?{}:{store})},{subscribe:false,forceRefetch:true})),signal);
  const identities=new Map<string,typeof items>();
  for(const item of items){const key=`${item.store}:${item.code??""}`;identities.set(key,[...(identities.get(key)??[]),item]);}
  return scoped.filter((row)=>{
    const matches=identities.get(`${row.store}:${row.itemCode??""}`);
    const item=matches?.[0];
    if(!row.itemCode||matches?.length!==1||!item) throw new Error("A report item could not be uniquely matched to its store and code. No unverified filtered report was created.");
    return selectedReportValue(filters,"item",item.id)&&selectedReportValue(filters,"category",item.itemCategory?.id)&&selectedReportValue(filters,"classification",item.classification);
  });
}
