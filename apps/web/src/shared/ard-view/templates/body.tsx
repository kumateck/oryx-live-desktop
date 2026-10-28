import {
  FormResponseDto,
  FormSectionDto,
} from "@/shared/ard-view/dto";
import React from "react";
import TestSpecification from "./specification";
import TestDetailedViewEnhanced from "./test";
import UniformitySection from "./uniformity";
import { splitUniformitySections } from "./uniformity-sections";

interface Props {
  sections?: FormSectionDto[] | null | undefined;
  responses?: FormResponseDto[] | null | undefined;
  showRemarks?: boolean | undefined;
  noResponse?: boolean | undefined;
}

const ArdTemplateBody = ({
  sections,
  responses,
  showRemarks = true,
  noResponse = false,
}: Props) => {
  const { testSections, uniformityFields } = React.useMemo(
    () => splitUniformitySections(sections),
    [sections],
  );

  return (
    <>
      <TestSpecification
        responses={responses}
        sections={sections}
        showRemarks={showRemarks}
        noResponse={noResponse}
      />
      <UniformitySection
        fields={uniformityFields}
        responses={responses}
        noResponse={noResponse}
      />
      <TestDetailedViewEnhanced
        responses={responses}
        sections={testSections}
        showQuestionLabels
        showInstrumentInfo
        noResponse={noResponse}
      />
    </>
  );
};

export default ArdTemplateBody;
