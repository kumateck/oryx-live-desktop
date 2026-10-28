import { TransferDirection } from "./status";
export const transfersPath = "/production/stock-transfer-requests";
export const transferPath = (id: string, direction: TransferDirection) => `${transfersPath}/${encodeURIComponent(id)}/details?type=${direction}`;
export const transferPermissions = { incoming: "CanViewIncomingStockTransferRequests", outgoing: "CanViewOutgoingStockTransferRequests", decide: "CanApproveIncomingStockTransferRequest" } as const;
export const transferAudit = { module: "Production", subModule: "Stock Transfer Requests" } as const;
export const directionPermission = (direction: TransferDirection) => direction === TransferDirection.Incoming ? transferPermissions.incoming : transferPermissions.outgoing;
