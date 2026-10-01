import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ToolbarButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

export function ToolbarButton({ label, icon, onClick, active, disabled }: ToolbarButtonProps) {
  return <Button type="button" variant="ghost" size="icon-sm" title={label} aria-label={label}
    aria-pressed={active} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick}
    className={active ? "bg-accent text-accent-foreground" : undefined}>{icon}</Button>;
}
