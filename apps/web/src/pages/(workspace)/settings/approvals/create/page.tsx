import { useNavigate } from "react-router";
import { ApprovalEditor } from "@/modules/approval-settings/components/approval-editor";
export default function CreateApprovalPage() {
  const navigate = useNavigate();
  return <ApprovalEditor onClose={() => { void navigate("/settings/approvals"); }} />;
}
