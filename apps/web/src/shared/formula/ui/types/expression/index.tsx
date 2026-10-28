import { FormulaTypes } from "@/shared/formula/ui/legacy";
import { TheAduseiFormulaProps } from "../type";

import { UniformityOfWeightConfig } from "./uniformity";
import { SimpleConfig } from "./simple";
// import { ComplexConfig } from "./complex";
import { UniversalConfig } from "./universal/config";

interface FormulaTypesProps extends TheAduseiFormulaProps {
  type?: FormulaTypes | undefined;
}

const TheAduseiFormula = ({
  onChange,
  onUniversalPayloadChange,
  value,
  disabled,
  type,
}: FormulaTypesProps) => {
  const renderFormula = (type?: FormulaTypes) => {
    switch (type) {
      case FormulaTypes.Simple:
        return (
          <SimpleConfig onChange={onChange} value={value} disabled={disabled} />
        );
      // case FormulaTypes.Uni:
      //   return (
      //     <UniversalConfig
      //       onChange={onChange}
      //       value={value}
      //       disabled={disabled}
      //     />
      //   );
      case FormulaTypes.Uniformity:
        return (
          <UniformityOfWeightConfig
            onChange={onChange}
            value={value}
            disabled={disabled}
          />
        );
      case FormulaTypes.Universal:
        return (
          <UniversalConfig
            onChange={onChange}
            onUniversalPayloadChange={onUniversalPayloadChange}
            value={value}
            disabled={disabled}
          />
        );
      default:
        return null;
    }
  };

  return renderFormula(type);
};

export default TheAduseiFormula;
