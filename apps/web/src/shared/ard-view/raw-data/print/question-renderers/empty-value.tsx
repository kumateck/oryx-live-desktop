import { QuestionType } from "@/shared/ard-view/legacy";
import { QuestionOptionDto } from "@/shared/ard-view/dto";
import ViewFormulaQuestion from "../view-formula-question";
import { renderTablePreview } from "./table-preview";

const writableLine = (height: string) => (
  <div
    className={`w-full border-b border-border print:border-slate-400 ${height}`}
  />
);

const getOptionMarker = (questionType?: QuestionType) => {
  if (questionType === QuestionType.Checkbox) return "□";
  if (questionType === QuestionType.SingleChoice) return "○";
  if (questionType === QuestionType.Dropdown) return "▾";
  return "•";
};

export const renderEmptyValue = (
  questionType?: QuestionType | undefined,
  options?: QuestionOptionDto[],
) => {
  const hasOptions = Boolean(options?.length);

  switch (questionType) {
    case QuestionType.ShortAnswer:
      return writableLine("h-6");

    case QuestionType.LongAnswer:
      return writableLine("h-8");

    case QuestionType.Paragraph:
      return (
        <div className="space-y-2 py-1">
          {writableLine("h-6")}
          {writableLine("h-6")}
          {writableLine("h-6")}
        </div>
      );

    case QuestionType.Reference:
    case QuestionType.Specification:
    case QuestionType.Signature:
    case QuestionType.FileUpload:
      return writableLine("h-7");

    case QuestionType.Table:
      return renderTablePreview(options);

    case QuestionType.Datepicker:
      return (
        <span className="text-document-12 text-foreground print:text-black">
          ____/____/________
        </span>
      );

    case QuestionType.SingleChoice:
    case QuestionType.Dropdown:
    case QuestionType.Checkbox:
      if (!hasOptions)
        return (
          <span className="text-sm text-foreground print:text-black">
            &nbsp;
          </span>
        );
      return (
        <ul className="space-y-1 pl-0 text-sm text-foreground print:text-black">
          {options?.map((opt, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="font-medium">
                {getOptionMarker(questionType)}
              </span>
              <span>{opt.name}</span>
            </li>
          ))}
        </ul>
      );

    case QuestionType.Formula:
      return <ViewFormulaQuestion questionOption={options?.[0]} />;

    default:
      return writableLine("h-6");
  }
};
