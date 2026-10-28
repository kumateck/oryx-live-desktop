import { fullname, sanitizeString } from "@/shared/ard-view/legacy";
import { formatBatchMonth as formatExpiryDate } from "@/shared/ard-view/legacy";
import { AnalyticalTestRequestDto } from "@/shared/ard-view/dto";
import React from "react";
import DataCell from "../data-cell";
import { formatDate } from "../utils";

// Main Component Props
interface SummaryProps {
  data?: AnalyticalTestRequestDto | undefined;
  revisionNumber?: string | undefined;
  stpNumber?: string | undefined;
  issueNumber?: string | undefined;
  specNumber?: string | undefined;
  title?: string | undefined;
  fallback?: {
    productName?: string | undefined;
    productCode?: string | undefined;
    stageLabel?: string | undefined;
  };
}

export const ProductSummary: React.FC<SummaryProps> = ({
  data,
  revisionNumber,
  stpNumber,
  issueNumber,
  specNumber,
  title,
  fallback,
}) => {
  const {
    batchManufacturingRecord,
    arNumber,
    manufacturingDate,
    expiryDate,
    sampledAt,
  } = data ?? {};

  const product =
    data?.productionScheduleProduct?.product ??
    batchManufacturingRecord?.productionScheduleProduct?.product;
  const productName = sanitizeString(product?.name ?? fallback?.productName);
  const productCode =
    "Code: " + sanitizeString(product?.code ?? fallback?.productCode ?? "-");
  const batchNumber = sanitizeString(
    batchManufacturingRecord?.batchNumber ??
      data?.productionScheduleProduct?.batchNumber,
  );
  const issuedBy = fullname(
    sanitizeString(data?.issuedBy?.firstName ?? data?.createdBy?.firstName),
    sanitizeString(data?.issuedBy?.lastName ?? data?.createdBy?.lastName),
  );
  const issueDate = sanitizeString(
    data?.issuedAt ?? batchManufacturingRecord?.issuedDate,
  );
  const resolvedRevisionNumber =
    revisionNumber ?? sanitizeString(product?.revisionNumber) ?? "-";
  const resolvedIssueNumber =
    issueNumber ?? sanitizeString(data?.issueNumber) ?? "-";
  const stageLabelByValue: Record<number, string> = {
    0: "Intermediate",
    1: "Bulk",
    2: "Finished",
  };
  const stageLabel =
    stageLabelByValue[Number(data?.stage)] || fallback?.stageLabel || "-";
  const cellClassName = "outline outline-2 -outline-offset-1 outline-black";

  // Use sampledAt for analysis date as per the previous logic
  const analysisDate = sampledAt;
  return (
    <div className="p-1">
      <div className="grid grid-cols-3 border-2 border-black">
        <div
          className={`${cellClassName} col-span-3 p-2 text-center text-xl font-bold uppercase tracking-wider`}
        >
          {title}
        </div>
        {/* Column 1 */}
        <DataCell
          label="Batch No.:"
          value={batchNumber}
          className="border-r-2 border-b-2 border-black"
        />
        <DataCell
          label={productName}
          value={productCode}
          isMultiLine={true}
          rowSpan={2}
          className="border-r-2 border-b-2 border-black"
          labelClassName="text-lg"
        />
        <DataCell
          label="Stage:"
          value={stageLabel}
          className="border-b-2 border-black"
        />
        {/* Row 2 */}
        <DataCell
          label="A.R. No.:"
          value={sanitizeString(arNumber)}
          className="border-r-2 border-b-2 border-black"
        />
        <DataCell
          label="Revision No.:"
          value={resolvedRevisionNumber}
          className="border-b-2 border-black"
        />

        {/* Row 3 */}
        <DataCell
          label="Mfg. Date:"
          value={formatDate(
            manufacturingDate ?? batchManufacturingRecord?.manufacturingDate,
            "month-year",
          )}
          className="border-r-2 border-b-2 border-black"
        />
        <DataCell
          label="Sampled On:"
          value={formatDate(sanitizeString(sampledAt))}
          className="border-r-2 border-b-2 border-black"
        />
        <DataCell
          label="Analysis Date:"
          value={formatDate(sanitizeString(analysisDate))}
          className="border-b-2 border-black"
        />

        {/* Row 4 */}
        <DataCell
          label="Exp. Date:"
          value={formatExpiryDate(expiryDate ?? batchManufacturingRecord?.expiryDate)}
          className="border-r-2 border-b-2 border-black"
        />
        <DataCell
          label="Issued by:"
          value={issuedBy}
          className="border-r-2 border-b-2 border-black"
        />
        <DataCell
          label="Issue Date:"
          value={formatDate(issueDate)}
          className="border-b-2 border-black"
        />

        {/* Row 5 */}
        <DataCell
          label="Spec. No.:"
          value={specNumber}
          className="border-r-2 border-black"
        />
        <DataCell
          label="STP No.:"
          value={stpNumber}
          className="border-r-2 border-black"
        />
        <DataCell label="Issue No.:" value={resolvedIssueNumber} />
      </div>
    </div>
  );
};

export default ProductSummary;
