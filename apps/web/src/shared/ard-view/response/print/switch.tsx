import React from "react";
import { FormulaTypes } from "@/shared/ard-view/legacy";
import { SimplePreview } from "./preview/simple";
import { UniformityPreview } from "./preview/uniformity";
import { UniversalPreview } from "./preview/universal";

interface TheAduseiPreviewProps {
  type: FormulaTypes | null;
  settings: string;
  response: string;
}

export const TheAduseiPreviewPrint: React.FC<TheAduseiPreviewProps> = ({
  type,
  settings,
  response,
}) => {
  switch (type) {
    case FormulaTypes.Simple:
      return <SimplePreview settings={settings} response={response} />;
    case FormulaTypes.Uniformity:
      return <UniformityPreview settings={settings} response={response} />;
    // case FormulaTypes.Complex:
    //   return <ComplexPreview settings={settings} response={response} />;
    case FormulaTypes.Universal:
      return <UniversalPreview settings={settings} response={response} />;
    default:
      return (
        <div className="bg-muted border border-border text-warning rounded p-2 text-xs">
          Unknown formula type: {String(type)}
        </div>
      );
  }
};
