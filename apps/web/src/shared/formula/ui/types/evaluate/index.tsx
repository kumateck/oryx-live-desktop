import { FormulaTypes } from "@/shared/formula/ui/legacy";
import { formulaPreview as extractFormulaPreview } from "@/shared/formula/formula-preview";
import { useMemo } from "react";
import { ExpressionExtract, TheAduseiEvaluateProps } from "../type";
import { SimpleEvaluate } from "../expression/simple";
import { UniformityOfWeightEvaluate } from "../expression/uniformity";
import { AuthorizedUniversalEvaluate } from "../expression/universal/authorized-evaluate/evaluate";

// import ComplexEvaluate from "./complex";
// import SimpleEvaluate from "./simple";

export const TheAduseiEvaluation = ({
  onChange,
  value,
  option,
  showMetaPanels = true,
}: TheAduseiEvaluateProps) => {
  const parsed = useMemo<ExpressionExtract | null>(() => {
    try {
      if (!option || option.trim() === "") return null;
      return JSON.parse(option) as ExpressionExtract;
    } catch (e) {
      console.error("[ComplexEvaluate] Failed to parse option JSON:", e);
      return null;
    }
  }, [option]);
  const type = parsed ? extractFormulaPreview(option).type : null;

  const renderFormula = (type: FormulaTypes | null) => {
    switch (type) {
      case FormulaTypes.Simple:
        return (
          <SimpleEvaluate onChange={onChange} value={value} settings={option} />
        );
      case FormulaTypes.Uniformity:
        return (
          <UniformityOfWeightEvaluate
            onChange={onChange}
            value={value}
            settings={option}
          />
        );
      // case FormulaTypes.Complex:
      //   return (
      //     <ComplexEvaluate
      //       onChange={onChange}
      //       value={value}
      //       settings={option}
      //     />
      //   );
      case FormulaTypes.Universal:
        return (
          <AuthorizedUniversalEvaluate
            onChange={onChange}
            value={value}
            settings={option}
            showMetaPanels={showMetaPanels}
          />
        );
      default:
        return (
          <UniformityOfWeightEvaluate
            onChange={onChange}
            value={value}
            settings={option}
          />
        );
    }
  };

  return renderFormula(type);
};
