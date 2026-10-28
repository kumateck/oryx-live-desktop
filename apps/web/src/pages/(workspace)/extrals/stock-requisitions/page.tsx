import { StockRequisitionsList } from "@/modules/stock-requisitions/components/requisitions-list";
import { stockRequisitionRoot } from "@/modules/stock-requisitions/lib/stock-requisitions";

export default function StockRequisitionsRoute() {
  return <StockRequisitionsList mode="raise" root={stockRequisitionRoot} detailPath={(id) => `${stockRequisitionRoot}/${id}/details`} />;
}
