import {
  sanitizeNumber,
  sanitizeString,
} from "@/shared/ard-view/legacy";
import { formatBatchMonth as formatExpiryDate, quantityText } from "@/shared/ard-view/legacy";
import { MaterialBatchArdRead } from "@/shared/ard-view/dto";
import React from "react";
import DataCell from "../data-cell";
import { formatDate } from "../utils";

// Main Component Props
interface SummaryProps {
  data?: MaterialBatchArdRead | undefined;
  title: string;
  fallback?: {
    materialName?: string | undefined;
    materialCode?: string | undefined;
    analysisDate?: string | undefined;
    specNumber?: string | undefined;
    stpNumber?: string | undefined;
  };
}

export const MaterialSummary: React.FC<SummaryProps> = ({
  data,
  title,
  fallback,
}) => {
  const batchNumber = data?.materialBatch?.batchNumber ?? "-";
  const materialName =
    data?.materialBatch?.material?.name ?? fallback?.materialName ?? "-";
  const materialCode =
    "Code: " +
    (data?.materialBatch?.material?.code ?? fallback?.materialCode ?? "-");
  const formatQuantity = (value?: number | null) => {
    if (value == null) return "-";
    return quantityText(sanitizeNumber(value), data?.materialBatch?.uoM?.symbol);
  };
  const qtyReceivedDisplay = formatQuantity(data?.quantityReceived);
  const qtySampledDisplay = formatQuantity(data?.quantitySampled);

  const arNumber = sanitizeString(data?.arNumber);
  const manufacturingDate = data?.materialBatch?.manufacturingDate;
  const expiryDate = data?.materialBatch?.expiryDate;
  const sampledAt = data?.sampledDate;
  const issuedDate = data?.materialBatch?.issuedAt;
  const analysisDate =
    data?.materialBatch?.analysedDate ?? fallback?.analysisDate;
  const issuedBy = sanitizeString(data?.materialBatch?.issuedBy?.name);
  const issueNumber = data?.materialBatch?.issueNumber;
  const specNumber = data?.specNumber ?? fallback?.specNumber;
  const stpNumber = data?.stpNumber ?? fallback?.stpNumber;
  const grnNumber = data?.grnNumber;
  const supplierName = data?.supplier?.name;
  const manufacturerName = data?.manufacturer?.name;
  const supplier =
    supplierName || manufacturerName
      ? `${supplierName}/${manufacturerName}`
      : "-";
  const cellClassName = "outline outline-2 -outline-offset-1 outline-black";

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
          className={cellClassName}
        />
        <DataCell
          label={materialName}
          value={materialCode}
          isMultiLine={true}
          rowSpan={2}
          className={cellClassName}
          labelClassName="text-lg"
        />
        <DataCell
          label="Qty Received:"
          value={qtyReceivedDisplay}
          className={cellClassName}
        />
        {/* Row 2 */}
        <DataCell
          label="A.R. No.:"
          value={arNumber}
          className={cellClassName}
        />
        <DataCell
          label="Qty Sampled:"
          value={qtySampledDisplay}
          className={cellClassName}
        />

        {/* Row 3 */}
        <DataCell
          label="Mfg. Date:"
          value={formatDate(manufacturingDate, "month-year")}
          className={cellClassName}
        />
        <DataCell
          label="Sampled On:"
          value={formatDate(sanitizeString(sampledAt))}
          className={cellClassName}
        />
        <DataCell
          label="Issue No.:"
          value={issueNumber}
          className={cellClassName}
        />

        {/* Row 4 */}
        <DataCell
          label="Exp. Date:"
          value={formatExpiryDate(expiryDate)}
          className={cellClassName}
        />
        <DataCell
          label="Analysis Date:"
          value={formatDate(sanitizeString(analysisDate))}
          className={cellClassName}
        />
        <DataCell
          label="Issue Date:"
          value={formatDate(issuedDate)}
          className={cellClassName}
        />
        {/* Row 5 */}

        <DataCell
          label="GRN No.:"
          value={grnNumber}
          className={cellClassName}
        />

        <DataCell
          label="Spec. No.:"
          value={specNumber}
          className={cellClassName}
        />

        <DataCell
          label="Issued by:"
          value={issuedBy}
          className={cellClassName}
        />
        <DataCell
          label="STP No.:"
          value={stpNumber}
          className={cellClassName}
        />
        <DataCell
          label="Supplier/Manufacturer.:"
          value={supplier}
          colSpan={2}
          className={cellClassName}
        />
      </div>
    </div>
  );
};

export default MaterialSummary;
