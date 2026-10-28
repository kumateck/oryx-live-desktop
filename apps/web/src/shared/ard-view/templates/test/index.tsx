import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { QuestionType, sanitizeNumber, sanitizeString } from "@/shared/ard-view/legacy";
import {
  FormResponseDto,
  FormSectionDto,
} from "@/shared/ard-view/dto";
import React from "react";
import {
  getHeaderFieldForSection,
  hasMeaningfulResponse,
  isSectionQuestionLabelDistinct,
} from "@/shared/ard-view/raw-data/print/section-utils";
import {
  renderPrintStoredResponseValue,
  renderResponseValue,
} from "@/shared/ard-view/raw-data/print/question-view";
import { getBestResponseMap } from "@/shared/ard-view/raw-data/print/response-pick";

interface TestDetailedViewEnhancedProps {
  sections: FormSectionDto[] | undefined | null;
  responses: FormResponseDto[] | undefined | null;
  showInstrumentInfo?: boolean | undefined;
  showQuestionLabels?: boolean | undefined;
  noResponse?: boolean | undefined;
}

const getSectionInstrumentValue = (instrument: unknown) => {
  if (typeof instrument === "string") return instrument;
  if (!instrument || typeof instrument !== "object") return "";
  const record = instrument as { id?: unknown; name?: unknown };
  return sanitizeString(record.id) || sanitizeString(record.name);
};

const TestDetailedViewEnhanced: React.FC<TestDetailedViewEnhancedProps> = ({
  sections,
  responses,
  noResponse = false,
  showInstrumentInfo = true,
  showQuestionLabels = true,
}) => {
  const responseMap = React.useMemo(
    () =>
      noResponse
        ? new Map<string, FormResponseDto>()
        : getBestResponseMap(responses ?? []),
    [noResponse, responses],
  );

  return (
    <div className="p-1">
      <table className="w-full border-collapse border-2 border-border print:border-black">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border print:border-black px-3 py-2 text-left font-bold text-base w-[10%]">
              No.
            </th>
            <th className="border border-border print:border-black px-3 py-2 text-left font-bold text-base w-[90%]">
              Test & Observations
            </th>
          </tr>
        </thead>
        <tbody>
          {sections?.map((section, sectionIndex) => {
            const fields = section.fields ?? [];
            const instrumentField = getHeaderFieldForSection(
              fields,
              QuestionType.Instrument,
              responseMap,
            );
            const equipmentField = getHeaderFieldForSection(
              fields,
              QuestionType.Equipment,
              responseMap,
            );
            const instrumentValue =
              instrumentField?.value ||
              getSectionInstrumentValue(section.instrument);
            const hasInstrument = Boolean(
              instrumentField?.exists || instrumentValue,
            );
            return (
              <React.Fragment key={section.id}>
                {/* Section Header Row */}
                <tr className="">
                  <td className="border border-border print:border-black px-3 py-2 text-left align-top font-normal">
                    {sectionIndex + 1}
                  </td>
                  <td className="border border-border print:border-black px-3 py-2 align-top">
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-bold text-base">
                        <RichTextView
                          html={sanitizeString(section.name)}
                        />
                      </div>
                      {showInstrumentInfo && (
                        <div className="shrink-0 space-y-4 text-right text-sm">
                          {hasInstrument && (
                            <div>
                              <div className="font-semibold">Instrument ID</div>
                              <div>{instrumentValue || "________________"}</div>
                            </div>
                          )}
                          {equipmentField?.exists && (
                            <div>
                              <div className="font-semibold">Equipment ID</div>
                              <div>
                                {equipmentField.value || "________________"}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Questions and Answers Row */}
                <tr className="">
                  <td className="border border-border print:border-black px-3 py-2"></td>
                  <td className="border border-border print:border-black px-3 py-2">
                    <div className="py-2 min-h-25">
                      {fields
                        .filter(
                          (field) =>
                            sanitizeNumber(field.question?.type) !==
                              sanitizeNumber(QuestionType.Instrument) &&
                            sanitizeNumber(field.question?.type) !==
                              sanitizeNumber(QuestionType.Equipment),
                        )
                        .map((field) => {
                          const questionLabel = sanitizeString(
                            field?.question?.label,
                          );
                          const shouldShowQuestionLabel =
                            showQuestionLabels &&
                            isSectionQuestionLabelDistinct(
                              section.name,
                              questionLabel,
                            );
                          const response = field.id
                            ? responseMap.get(field.id)
                            : undefined;
                          const hasResponse =
                            !noResponse && hasMeaningfulResponse(response);
                          const valueNode = noResponse
                            ? renderResponseValue(
                                field.question?.type,
                                field.question?.options ?? undefined,
                              )
                            : hasResponse
                              ? renderPrintStoredResponseValue(response, field)
                              : renderResponseValue(
                                  field.question?.type,
                                  field.question?.options ?? undefined,
                                );

                          if (
                            !noResponse &&
                            !shouldShowQuestionLabel &&
                            !hasResponse
                          ) {
                            return null;
                          }

                          return (
                            <div key={field.id} className="mb-4 last:mb-0">
                              {shouldShowQuestionLabel && (
                                <div className="text-sm font-medium text-foreground mb-2">
                                  {questionLabel}:
                                </div>
                              )}
                              <div>{valueNode}</div>
                            </div>
                          );
                        })}
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TestDetailedViewEnhanced;
