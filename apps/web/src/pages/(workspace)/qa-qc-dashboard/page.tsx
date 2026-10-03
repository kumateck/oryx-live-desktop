import { Navigate } from "react-router";
import { useAccess } from "@/shared/auth/use-access";

/** The quality dashboards have no page of their own: this opens the one the user may see. */
export default function QualityDashboardsPageRoute() {
  const { can } = useAccess();
  const qc = can({ kind: "some", permissions: ["CanViewRawMaterialGoodsReceiptNotes", "CanViewPackagingMaterialGoodsReceiptNotes"] });
  return <Navigate to={qc ? "/qa-qc-dashboard/qc" : "/qa-qc-dashboard/qa"} replace />;
}
