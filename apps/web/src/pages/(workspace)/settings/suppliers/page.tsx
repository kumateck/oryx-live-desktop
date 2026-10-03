import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { SuppliersTable } from "@/modules/suppliers/components/suppliers-table";
import { useSuppliersList } from "@/modules/suppliers/hooks/use-suppliers-list";
import { supplierPath, supplierPermissions, suppliersPath } from "@/modules/suppliers/lib/supplier-access";

export default function SuppliersPage() {
  const list = useSuppliersList();
  const navigate = useNavigate();
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">INVENTORY CONFIGURATION</p><h1 className="text-xl font-semibold">Suppliers</h1></div>
      <PermissionGuard require={supplierPermissions.create}><Button asChild size="sm"><Link to={`${suppliersPath}/create`}>Create supplier</Link></Button></PermissionGuard>
    </div>
    <SuppliersTable {...list} onRetry={list.retry} onOpen={(row) => void navigate(supplierPath(row.id))} />
  </section>;
}
