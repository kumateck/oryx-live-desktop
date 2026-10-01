import { CalendarDaysIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

interface PickerTriggerProps extends Omit<ComponentProps<typeof Button>, "value"> {
  id: string;
  label: string;
  value: string | null;
  placeholder: string;
  invalid?: boolean | undefined;
  describedBy?: string | undefined;
}

export function PickerTrigger({ id, label, value, placeholder, disabled, invalid, describedBy, ...buttonProps }: PickerTriggerProps) {
  return <Button {...buttonProps} id={id} type="button" variant="outline" disabled={disabled} aria-label={label}
    aria-invalid={invalid} aria-describedby={describedBy}
    className="h-8 w-full min-w-0 justify-start gap-2 px-2.5 text-left font-normal">
    <CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    <span className={`truncate ${value ? "" : "text-muted-foreground"}`}>{value ?? placeholder}</span>
  </Button>;
}
