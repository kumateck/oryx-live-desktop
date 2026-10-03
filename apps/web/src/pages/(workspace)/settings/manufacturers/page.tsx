import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ManufacturersTable } from "@/modules/manufacturers/components/manufacturers-table";
import { useManufacturersList } from "@/modules/manufacturers/hooks/use-manufacturers-list";
import { manufacturerPath, manufacturerPermissions, manufacturersPath } from "@/modules/manufacturers/lib/manufacturer-access";

export default function ManufacturersPage() {
  const list = useManufacturersList();
  const navigate = useNavigate();
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">INVENTORY CONFIGURATION</p><h1 className="text-xl font-semibold">Manufacturers</h1></div>
      <PermissionGuard require={manufacturerPermissions.create}><Button asChild size="sm"><Link to={`${manufacturersPath}/create`}>Create manufacturer</Link></Button></PermissionGuard>
    </div>
    <ManufacturersTable {...list} onRetry={list.retry} onOpen={(row) => void navigate(manufacturerPath(row.id))} />
  </section>;
}
