import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { refreshTokens } from "../auth/session-api";
import { notifyPermissionDenied, notifySessionExpired } from "../auth/session-events";
import { tokenStore } from "../auth/token-store";
import { generatedTagTypes } from "./generated/cache-tag-types";

const request = fetchBaseQuery({
  baseUrl: typeof window === "undefined" ? "/" : `${window.location.origin}/`,
  credentials: "omit",
  prepareHeaders(headers) {
    const token = tokenStore.accessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

export const api = createApi({
  reducerPath: "oryxApi",
  baseQuery: async (args, context, extraOptions) => {
    let result = await request(args, context, extraOptions);
    if (result.error?.status === 401) {
      // The access token is short-lived: renew it once and repeat the request before giving up.
      const renewed = await refreshTokens().catch(() => false);
      if (renewed) result = await request(args, context, extraOptions);
      if (!renewed || result.error?.status === 401) notifySessionExpired();
    }
    // Never repeat a forbidden mutation. Refresh the session so routes and actions reflect the server's decision.
    if (result.error?.status === 403) notifyPermissionDenied();
    return result;
  },
  tagTypes: ["Designations", "LeaveTypes", "ShiftTypes", "ShiftCategories", "ShiftSchedules", "WorkingHoursPolicies", "Equipment", "QcEquipment", "CodeSettings", "Departments", "Holidays", "WorkingDays", "Uoms", "Role", "RoleList", "UserList", "ProductList", "Product", "ProductPacking", "ProductBom", "ProductPackages", "ProductRoutes", "ProductStp", "StpDocument", "ProductArd", "ProductSpecification", "ScheduleList", "Schedule", "ScheduleBatch", "Activity", "ActivityBoard", "BatchRecords", "StockOnShelves", "SupplierList", "Supplier", "ManufacturerList", "Manufacturer", "RequisitionList", "Requisition", "QuotationRequests", "QuotationResponses", "PriceComparison", "PurchaseOrderList", "PurchaseOrder", "StorageRacks", "StorageShelves", "DistributedStock", "ShipmentInvoices", "Shipments", "BillingSheets", "MaterialDistribution", "Receiving", "Grns", "PendingApprovals", "StockIssue", "StockTransfers", "MaterialList", "MaterialReturns", "StockAdjustments", "SwapRequests", "ProductAllocation", "Notifications", "Tickets", "Customers", "ProductionOrders", "FinishedGoods", ...generatedTagTypes],
  // A save refreshes what it changed through cache tags (docs/api-codegen.md, "Cache tags"). Other people's changes are
  // picked up when a page opens on data older than 30 seconds, when the window comes back into focus, and after a lost
  // connection returns. Going back and forth between pages within 30 seconds shows the cached data without asking again.
  refetchOnMountOrArgChange: 30,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
