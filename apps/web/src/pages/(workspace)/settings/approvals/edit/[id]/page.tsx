import { useParams } from "react-router";
import { ApprovalEditPage } from "@/modules/approval-settings/components/approval-edit-page";
export default function EditApprovalPage() {
  const { id = "" } = useParams();
  return <ApprovalEditPage id={id} />;
}
