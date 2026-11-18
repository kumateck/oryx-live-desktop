import { optionValues, selectedValues } from "./selected-options";
import {
  QuestionType,
  sanitizeNumber,
  sanitizeString,
  toSentenceCase,
} from "@/shared/ard-view/legacy";
import {
  FormResponseDto,
} from "@/shared/ard-view/dto";

const getMarker = (questionType: QuestionType, selected: boolean) => {
  if (questionType === QuestionType.Checkbox) return selected ? "■" : "□";
  if (questionType === QuestionType.SingleChoice) return selected ? "◉" : "○";
  return "▾";
};

interface SelectableOptionsProps {
  response: FormResponseDto;
}

const SelectableOptions = ({ response }: SelectableOptionsProps) => {
  const questionType = sanitizeNumber(
    response.formField?.question?.type,
  ) as QuestionType;
  const options = response.formField?.question?.options ?? [];
  const selected = new Set(selectedValues(response.value));

  if (!options.length) {
    return (
      <span className="text-sm text-foreground print:text-black">
        {toSentenceCase(Array.from(selected).join(", ")) || "—"}
      </span>
    );
  }

  return (
    <ul className="space-y-1 pl-0 text-sm text-foreground print:text-black">
      {options.map((option, index) => {
        const isSelected = optionValues(option).some((value) =>
          selected.has(value),
        );
        return (
          <li
            key={sanitizeString((option as { id?: unknown }).id) || index}
            className={`flex items-center gap-2 ${isSelected ? "font-semibold" : ""}`}
          >
            <span className="font-medium">
              {getMarker(questionType, isSelected)}
            </span>
            <span>{option.name}</span>
            {questionType === QuestionType.Dropdown && isSelected && (
              <span aria-label="Selected">✓</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default SelectableOptions;
