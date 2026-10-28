import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CoaComplianceControlProps {
  formSectionId: string;
  complies: boolean;
  onComplianceChange?: ((formSectionId: string, complies: boolean) => void) | undefined;
}

const CoaComplianceControl = ({
  formSectionId,
  complies,
  onComplianceChange,
}: CoaComplianceControlProps) => (
  <RadioGroup
    value={complies ? "complies" : "not-complies"}
    onValueChange={(value: string) =>
      onComplianceChange?.(formSectionId, value === "complies")
    }
    className="flex flex-col gap-2"
  >
    <div className="text-xs font-semibold text-muted-foreground">
      Confirm compliance
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem value="complies" id={`coa-complies-${formSectionId}`} />
      <Label htmlFor={`coa-complies-${formSectionId}`}>Complies</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem
        value="not-complies"
        id={`coa-not-complies-${formSectionId}`}
      />
      <Label htmlFor={`coa-not-complies-${formSectionId}`}>
        Does not comply
      </Label>
    </div>
  </RadioGroup>
);

export default CoaComplianceControl;
