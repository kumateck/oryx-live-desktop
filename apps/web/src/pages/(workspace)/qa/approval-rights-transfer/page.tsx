import { TransferRightsPage } from "@/modules/approval-rights-transfer/components/transfer-rights-page";

/** Quality assurance: the signed-in person hands their own approvals to whoever takes charge. */
export default function ApprovalRightsTransferPage() {
  return <TransferRightsPage scope="own" />;
}
