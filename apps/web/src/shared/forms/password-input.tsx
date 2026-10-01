import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type Ref } from "react";
import { Eye, EyeOff } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";

type PasswordInputProps = Omit<ComponentProps<"input">, "type" | "ref"> & { ref?: Ref<HTMLInputElement> };

/**
 * Password box with a button to show or hide what was typed.
 *
 * The password is hidden again when its form is submitted and when the field is disabled, so it is
 * not left readable on screen. A Caps Lock notice appears while typing with Caps Lock on.
 */
export function PasswordInput({ id, className, disabled, onKeyUp, onBlur, ref, ...input }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  const shown = visible && !disabled;

  useEffect(() => {
    const form = group.current?.closest("form");
    if (!form) return;
    const hide = () => setVisible(false);
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, []);

  const checkCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState("CapsLock"));
    onKeyUp?.(event);
  };

  return <div className="min-w-0 space-y-1">
    <InputGroup ref={group} className={className} data-disabled={disabled || undefined}>
      <InputGroupInput {...input} id={id} ref={ref} type={shown ? "text" : "password"} disabled={disabled}
        // A revealed password is still a password: keep browsers from learning or "correcting" it.
        autoCapitalize="off" autoCorrect="off" spellCheck={false}
        onKeyUp={checkCapsLock} onBlur={(event) => { setCapsLock(false); onBlur?.(event); }} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" disabled={disabled} aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown}
          {...(id ? { "aria-controls": id } : {})}
          // Keep the caret where it is: pressing the button must not move focus out of the field.
          onMouseDown={(event) => event.preventDefault()} onClick={() => setVisible((current) => !current)}>
          {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
    {capsLock ? <p role="status" className="text-xs text-muted-foreground">Caps Lock is on.</p> : null}
  </div>;
}
