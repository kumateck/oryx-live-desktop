import { TransferRightsPage } from "@/modules/approval-rights-transfer/components/transfer-rights-page";

/** IT: hand over the approvals of anyone named on an approval document, such as a person who left. */
export default function ItApprovalRightsTransferPage() {
  return <TransferRightsPage scope="any" />;
}
