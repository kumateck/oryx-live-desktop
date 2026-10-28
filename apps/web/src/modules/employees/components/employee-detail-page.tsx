import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { PageHeader } from "@/shared/navigation/page-header";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { employeeApi } from "../api/employee-api";
import { employeeAudit } from "../lib/access";
import { EmployeeRecord } from "./employee-record";
import { EmployeeActions } from "./employee-actions";
function Detail({ id }: { id: string }) {
  const query = employeeApi.useGetApiV1EmployeeByIdQuery({ ...employeeAudit, id });
  if (query.isLoading) return <DetailPageSkeleton label="Loading employee" groups={5} />;
  if (query.error || !query.currentData) return <div role="alert"><p>{query.error ? apiErrorMessage(query.error) : "Employee not found"}</p><Button onClick={() => void query.refetch()}>Retry employee</Button></div>;
  const employee = query.currentData;
  return <article className="space-y-5"><PageHeader title={`${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() || "Employee details"} crumbs={[{ label: "Human resources" }, { label: "Employee management", to: `/hr/employee-management?status=${employee.status ?? 0}` }, { label: employee.staffNumber ?? "Employee details" }]} actions={<EmployeeActions employee={employee} detail />} /><EmployeeRecord employee={employee} /></article>;
}
export function EmployeeDetailPage() { const { id } = useParams(); return id ? <Detail key={id} id={id} /> : <p role="alert">An employee identity is required.</p>; }
