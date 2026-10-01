import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "cn";
import type { LabelField, SpaceField, SubmitField } from "../form-wizard-types";
import { InputTypes } from "../input-types";

export default function LayoutField({ field }: { field: LabelField | SpaceField | SubmitField }) {
  switch (field.type) {
    case InputTypes.LABEL:
      return <div className={cn("min-w-0", field.className)}>
        <p className="text-sm font-medium text-foreground">{field.label}</p>
        {field.text ? <p className="text-sm text-muted-foreground">{field.text}</p> : null}
      </div>;
    case InputTypes.SPACE:
      return <div aria-hidden="true" className={cn(field.size === "lg" ? "h-6" : field.size === "md" ? "h-4" : "h-2", field.className)} />;
    case InputTypes.SUBMIT:
      return <Button type="submit" variant={field.variant} disabled={field.disabled || field.loading}
        className={cn("w-fit", field.className)}>
        {field.loading ? <Spinner data-icon="inline-start" /> : null}{field.label}
      </Button>;
  }
}
