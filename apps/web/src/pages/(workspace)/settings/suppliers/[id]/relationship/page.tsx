import { Navigate, useParams } from "react-router";
import { supplierPath, suppliersPath } from "@/modules/suppliers/lib/supplier-access";

/** The relationship records now live in the tabs of the supplier page; old links land there. */
export default function SupplierRelationshipPage() {
  const { id } = useParams();
  return <Navigate to={id ? `${supplierPath(id)}?tab=certifications` : suppliersPath} replace />;
}
