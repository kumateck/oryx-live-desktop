import { sanitizeString } from "@/shared/ard-view/legacy";
import { FormResponseDto } from "@/shared/ard-view/dto";
import { FileSpreadsheet, FileText, Presentation, File } from "lucide-react";

const isImageFile = (name?: string | null) =>
  /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(sanitizeString(name));

const fileExt = (name?: string | null) => {
  const safe = sanitizeString(name).toLowerCase();
  const parts = safe.split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
};

const fileTypeLabel = (name?: string | null) => {
  const ext = fileExt(name);
  if (ext === "pdf") return "PDF";
  if (ext === "xlsx" || ext === "xls") return "XLSX";
  if (ext === "doc" || ext === "docx") return "DOC";
  if (ext === "ppt" || ext === "pptx") return "PPTX";
  return ext ? ext.toUpperCase() : "FILE";
};

const fileTypeIcon = (name?: string | null) => {
  const ext = fileExt(name);
  if (ext === "pdf") return FileText;
  if (ext === "xlsx" || ext === "xls") return FileSpreadsheet;
  if (ext === "doc" || ext === "docx") return FileText;
  if (ext === "ppt" || ext === "pptx") return Presentation;
  return File;
};

export const renderPrintAttachments = (
  response: FormResponseDto,
  options?: { isSignature?: boolean },
) => {
  const isSignature = options?.isSignature ?? false;
  const attachments = response?.attachments || [];
  if (!attachments.length) return null;

  return (
    <div className="mt-1 space-y-1">
      {attachments.map((file, index) => {
        const name = sanitizeString(file.name) || `Attachment ${index + 1}`;
        const link = sanitizeString(file.link);
        const image = isImageFile(name);

        return (
          <div key={`${name}-${index}`} className="space-y-1">
            {image && link && (
              <img
                src={link}
                alt={name}
                width={isSignature ? 260 : 120}
                height={isSignature ? 90 : 70}
                loading={isSignature ? "eager" : "lazy"}
                className={`rounded border border-border print:border-slate-300 bg-white object-contain ${
                  isSignature ? "h-20 w-auto" : "h-14 w-auto"
                }`}
              />
            )}
            {!image && (
              <div className="flex gap-2 items-center">
                <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] font-semibold print:border-slate-400 print:bg-slate-100">
                  {(() => {
                    const Icon = fileTypeIcon(name);
                    return <Icon className="h-3 w-3" />;
                  })()}
                  {fileTypeLabel(name)}
                </span>
                <span>{name}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
