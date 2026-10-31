import { Check, Circle } from "lucide-react";
import { cn } from "cn";
import { passwordRuleHints } from "@/shared/auth/password-rules";

/** Live checklist of the server's password rules for what has been typed so far. */
export function PasswordRuleHints({ value }: { value: string }) {
  return <ul aria-label="Password rules" className="grid gap-1 text-xs sm:grid-cols-2">
    {passwordRuleHints.map((rule) => {
      const met = rule.met(value);
      return <li key={rule.label} className={cn("flex items-center gap-1.5", met ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>
        {met ? <Check aria-hidden="true" className="size-3.5" /> : <Circle aria-hidden="true" className="size-3" />}
        <span>{rule.label}</span><span className="sr-only">{met ? " (met)" : " (not met yet)"}</span>
      </li>;
    })}
  </ul>;
}
