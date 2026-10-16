import { hasMeaningfulResponse } from "@/shared/ard-view/raw-data/print/section-utils";
import {
  renderPrintStoredResponseValue,
  renderResponseValue,
} from "@/shared/ard-view/raw-data/print/question-view";
import { getBestResponseMap } from "@/shared/ard-view/raw-data/print/response-pick";
import {
  FormFieldDto,
  FormResponseDto,
} from "@/shared/ard-view/dto";
import React from "react";

interface Props {
  fields: FormFieldDto[];
  responses?: FormResponseDto[] | null | undefined;
  noResponse?: boolean | undefined;
}

const UniformitySection = ({
  fields,
  responses,
  noResponse = false,
}: Props) => {
  const responseMap = React.useMemo(
    () => getBestResponseMap(responses ?? []),
    [responses],
  );

  if (!fields.length) return null;

  return (
    <div className="space-y-4 p-1">
      {fields.map((field, index) => {
        const response = field.id ? responseMap.get(field.id) : undefined;
        const value =
          !noResponse && hasMeaningfulResponse(response)
            ? renderPrintStoredResponseValue(response, field)
            : renderResponseValue(
                field.question?.type,
                field.question?.options ?? undefined,
              );

        return <div key={field.id ?? index}>{value}</div>;
      })}
    </div>
  );
};

export default UniformitySection;
