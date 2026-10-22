import { StockRequisitionsList } from "@/modules/stock-requisitions/components/requisitions-list";
import { issueStockRoot } from "@/modules/stock-requisitions/lib/stock-requisitions";

export default function IssueStockRoute() {
  return <StockRequisitionsList mode="issue" root={issueStockRoot} detailPath={(id) => `${issueStockRoot}/${id}`} />;
}
