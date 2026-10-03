import { useState, type ReactNode } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A Print button that opens the document's preview. `preview` receives the function that closes it. */
export function PrintButton({ label = "Print", size = "sm", preview }: { label?: string; size?: "sm" | "default"; preview: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" size={size} variant="outline" onClick={() => setOpen(true)}><Printer />{label}</Button>
    {open ? preview(() => setOpen(false)) : null}
  </>;
}
