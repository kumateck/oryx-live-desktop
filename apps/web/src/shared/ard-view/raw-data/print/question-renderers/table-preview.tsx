import type { QuestionOptionDto } from "@/shared/ard-view/dto";
import { TableReadOnly } from "@/shared/questions/table-read-only";
import { getTableConfig } from "@/shared/ard-view/response/table-config";

export const renderTablePreview = (options?: QuestionOptionDto[]) => {
  const config = getTableConfig(options);
  return config ? <TableReadOnly config={config} /> : (
    <span className="text-sm text-muted-foreground">Table is not configured.</span>
  );
};
