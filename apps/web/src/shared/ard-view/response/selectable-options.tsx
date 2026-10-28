import {
  QuestionType,
  sanitizeNumber,
  sanitizeString,
  toSentenceCase,
} from "@/shared/ard-view/legacy";
import {
  FormResponseDto,
  QuestionOptionDto,
} from "@/shared/ard-view/dto";

const normalize = (value: unknown) =>
  sanitizeString(value).trim().toLowerCase();

const getOptionValues = (option: QuestionOptionDto) =>
  [
    (option as { id?: unknown }).id,
    (option as { value?: unknown }).value,
    (option as { label?: unknown }).label,
    option.name,
  ]
    .map(normalize)
    .filter(Boolean);

const extractSelectedValues = (value: unknown): string[] => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(extractSelectedValues);
  if (typeof value === "object") {
    const record = value as { label?: unknown; value?: unknown };
    return [record.value, record.label].map(normalize).filter(Boolean);
  }

  const raw = sanitizeString(value).trim();
  if (!raw) return [];
  try {
    return extractSelectedValues(JSON.parse(raw) as unknown);
  } catch {
    const quotedValues = Array.from(
      raw.matchAll(/"(?:value|label)"\s*:\s*"([^"]+)"/gi),
      (match) => normalize(match[1]),
    );
    const commaValues = raw
      .replace(/\[[\s\S]*\]/g, "")
      .split(",")
      .map(normalize)
      .filter(Boolean);
    return [...quotedValues, ...commaValues];
  }
};

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
  const selectedValues = new Set(extractSelectedValues(response.value));

  if (!options.length) {
    return (
      <span className="text-sm text-foreground print:text-black">
        {toSentenceCase(Array.from(selectedValues).join(", ")) || "—"}
      </span>
    );
  }

  return (
    <ul className="space-y-1 pl-0 text-sm text-foreground print:text-black">
      {options.map((option, index) => {
        const selected = getOptionValues(option).some((value) =>
          selectedValues.has(value),
        );
        return (
          <li
            key={sanitizeString((option as { id?: unknown }).id) || index}
            className={`flex items-center gap-2 ${selected ? "font-semibold" : ""}`}
          >
            <span className="font-medium">
              {getMarker(questionType, selected)}
            </span>
            <span>{option.name}</span>
            {questionType === QuestionType.Dropdown && selected && (
              <span aria-label="Selected">✓</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default SelectableOptions;
