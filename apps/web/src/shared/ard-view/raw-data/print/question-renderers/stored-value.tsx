import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { QuestionType, sanitizeString, toSentenceCase } from "@/shared/ard-view/legacy";
import { FormResponseDto } from "@/shared/ard-view/dto";
import { format } from "date-fns";
import ViewFormulaQuestion from "../view-formula-question";
import { TableValue } from "@/shared/ard-view/response/table-value";
import { parsedResponseValueOnly } from "./parsers/value";
import { renderPrintAttachments } from "./attachments";
import SelectableOptions from "@/shared/ard-view/response/selectable-options";

export const renderStoredValue = (response?: FormResponseDto) => {
  if (!response) {
    return (
      <span className="text-sm text-foreground print:text-black">&nbsp;</span>
    );
  }

  const questionType = response.formField?.question?.type;
  const rawValue = sanitizeString(response.value);
  const valueOnly = parsedResponseValueOnly(rawValue);

  if (
    questionType === QuestionType.Paragraph ||
    questionType === QuestionType.LongAnswer
  ) {
    return (
      <div className="text-sm text-foreground print:text-black">
        <RichTextView html={sanitizeString(response.value)} />
      </div>
    );
  }

  if (questionType === QuestionType.Formula) {
    return (
      <ViewFormulaQuestion
        questionOption={response.formField?.question?.options?.[0]}
        responseRecord={response}
        response={response.value}
      />
    );
  }

  if (questionType === QuestionType.Table) {
    return <TableValue value={response.value} response={response} />;
  }

  if (questionType === QuestionType.Datepicker) {
    const parsedDate = new Date(valueOnly);
    const isValidDate = Number.isFinite(parsedDate.getTime());
    return (
      <span className="text-sm text-foreground print:text-black">
        {isValidDate ? format(parsedDate, "MMM d, yyyy") : valueOnly || "—"}
      </span>
    );
  }

  if (questionType === QuestionType.FileUpload) {
    return (
      <div className="text-sm text-foreground print:text-black">
        {renderPrintAttachments(response) ?? "—"}
      </div>
    );
  }

  if (questionType === QuestionType.Signature) {
    return (
      <div className="text-sm text-foreground print:text-black">
        {renderPrintAttachments(response, { isSignature: true }) ?? "—"}
      </div>
    );
  }

  if (
    questionType === QuestionType.SingleChoice ||
    questionType === QuestionType.Dropdown ||
    questionType === QuestionType.Checkbox
  ) {
    return <SelectableOptions response={response} />;
  }

  return (
    <span className="text-sm text-foreground print:text-black">
      {toSentenceCase(valueOnly)}
    </span>
  );
};
