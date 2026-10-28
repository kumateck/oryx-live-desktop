import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { sanitizeString } from "@/shared/ard-view/legacy";
import {
  FormResponseDto,
  FormSectionDto,
} from "@/shared/ard-view/dto";
import { getBestResponseMap } from "@/shared/ard-view/raw-data/print/response-pick";
import React from "react";
import { getResponsesForSection } from "../render";

interface ProductTestTableProps {
  sections: FormSectionDto[] | undefined | null;
  responses: FormResponseDto[] | undefined | null;
  showRemarks?: boolean | undefined;
  remarksText?: string | undefined;
  noResponse?: boolean | undefined;
}

type SpecificationRow =
  | { type: "section"; section: FormSectionDto }
  | { type: "group"; name: string; sections: FormSectionDto[] };

export const groupSpecificationSections = (
  sections: FormSectionDto[] | undefined | null,
): SpecificationRow[] => {
  const groupCounts = new Map<string, number>();

  sections?.forEach((section) => {
    const groupName = sanitizeString(section.groupName).trim();
    if (groupName)
      groupCounts.set(groupName, (groupCounts.get(groupName) ?? 0) + 1);
  });

  const grouped = new Map<string, FormSectionDto[]>();
  const rows: SpecificationRow[] = [];

  sections?.forEach((section) => {
    const groupName = sanitizeString(section.groupName).trim();
    if (!groupName || (groupCounts.get(groupName) ?? 0) < 2) {
      rows.push({ type: "section", section });
      return;
    }

    const groupSections = grouped.get(groupName);
    if (groupSections) {
      groupSections.push(section);
      return;
    }

    const nextGroup = [section];
    grouped.set(groupName, nextGroup);
    rows.push({ type: "group", name: groupName, sections: nextGroup });
  });

  return rows;
};

const TestSpecification: React.FC<ProductTestTableProps> = ({
  sections,
  responses,
  noResponse,
  showRemarks = true,
  remarksText,
}) => {
  const responseMap = React.useMemo(
    () => getBestResponseMap(responses ?? []),
    [responses],
  );
  const rows = React.useMemo(
    () => groupSpecificationSections(sections),
    [sections],
  );

  // Generate remarks automatically based on compliance
  const generateRemarks = (): string => {
    if (remarksText) return remarksText;

    const allResponses = responses?.map((r) => r?.value?.toLowerCase());
    const hasNonCompliance = allResponses?.some(
      (val) =>
        val?.includes("does not comply") || val?.includes("not complies"),
    );

    return hasNonCompliance
      ? "The above sample received Does not Complies with respect to specification."
      : "The above sample received Complies with respect to specification.";
  };

  return (
    <div className="w-full p-1">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse border-2 border-border print:border-black">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border print:border-black px-3 py-2 text-center font-bold text-base w-[5%]">
                No.
              </th>
              <th className="border border-border print:border-black px-3 py-2 text-center font-bold text-base w-[28%]">
                Test
              </th>
              <th className="border border-border print:border-black px-3 py-2 text-center font-bold text-base w-[25%]">
                Result / Observation
              </th>
              <th className="border border-border print:border-black px-3 py-2 text-center font-bold text-base w-[42%]">
                Specification
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              if (row.type === "group") {
                return (
                  <tr key={`group-${row.name}`}>
                    <td className="border border-border print:border-black px-3 py-2 text-center align-top">
                      {index + 1}
                    </td>
                    <td className="border border-border print:border-black px-3 py-2 align-top">
                      <div className="mb-1 whitespace-nowrap font-semibold">
                        {row.name}
                      </div>
                      <div className="space-y-5 pl-4">
                        {row.sections.map((section) => (
                          <div
                            key={section.id}
                            className="flex gap-2 whitespace-nowrap leading-relaxed"
                          >
                            <span aria-hidden="true">•</span>
                            <RichTextView
                              html={sanitizeString(section.name)}
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="border border-border print:border-black px-3 py-2 text-center align-top italic">
                      <div aria-hidden="true">&nbsp;</div>
                      <div className="space-y-5">
                        {row.sections.map((section) => (
                          <div key={section.id} className="leading-relaxed">
                            {noResponse
                              ? ""
                              : getResponsesForSection(
                                  section?.fields ?? [],
                                  responseMap,
                                )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="border border-border print:border-black px-3 py-2 align-top">
                      <div aria-hidden="true">&nbsp;</div>
                      <div className="space-y-5">
                        {row.sections.map((section) => (
                          <div key={section.id} className="leading-relaxed">
                            <RichTextView
                              html={sanitizeString(section.description)}
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              }

              const { section } = row;
              const result = getResponsesForSection(
                section?.fields ?? [],
                responseMap,
              );

              return (
                <tr key={section.id} className="">
                  <td className="border border-border print:border-black px-3 py-2 text-center align-top">
                    {index + 1}
                  </td>
                  <td className="border border-border print:border-black px-3 py-2 align-top">
                    <div className="whitespace-nowrap">
                      <RichTextView
                        html={sanitizeString(section.name)}
                      />
                    </div>
                  </td>
                  <td className="border border-border print:border-black px-3 py-2 text-center align-top italic">
                    {noResponse ? "" : result}
                  </td>
                  <td className="border border-border print:border-black px-3 py-2 align-top">
                    <RichTextView
                      html={sanitizeString(section.description)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showRemarks && (
        <div className="mt-5 text-sm leading-relaxed">
          <span className="font-bold">Remarks:</span> {generateRemarks()}
        </div>
      )}
    </div>
  );
};

export default TestSpecification;
