import { useEffect, useId, useRef, type PointerEvent } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import type { SignatureField } from "../form-wizard-types";

function point(event: PointerEvent<HTMLCanvasElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * event.currentTarget.width / Math.max(bounds.width, 1),
    y: (event.clientY - bounds.top) * event.currentTarget.height / Math.max(bounds.height, 1),
  };
}

export default function SignatureInputField({ field }: { field: SignatureField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastExport = useRef<string | null>(null);
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const value = typeof control.value === "string" ? control.value : null;
  const error = fieldState.error?.message;
  useEffect(() => {
    const target = canvas.current;
    const context = target?.getContext("2d");
    if (!target || !context || value === lastExport.current) return;
    context.clearRect(0, 0, target.width, target.height);
    if (!value?.startsWith("data:image/png;base64,")) return;
    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, target.width, target.height);
    image.src = value;
    return () => { image.onload = null; };
  }, [value]);
  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    if (field.disabled) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    drawing.current = true;
    const position = point(event);
    context.beginPath();
    context.moveTo(position.x, position.y);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.5;
    context.strokeStyle = "#1a1c1f";
    context.lineTo(position.x + 0.01, position.y);
    context.stroke();
  };
  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const position = point(event);
    context.lineTo(position.x, position.y);
    context.stroke();
  };
  const finish = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const result = event.currentTarget.toDataURL("image/png");
    lastExport.current = result;
    control.onChange(result);
    control.onBlur();
  };
  const clear = () => {
    const target = canvas.current;
    target?.getContext("2d")?.clearRect(0, 0, target.width, target.height);
    lastExport.current = null;
    control.onChange(null);
  };
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <canvas id={id} ref={canvas} width={640} height={160} tabIndex={field.disabled ? -1 : 0}
      aria-label={`${field.label} drawing area`} aria-disabled={field.disabled} aria-required={field.required}
      aria-invalid={Boolean(error)} aria-describedby={fieldDescription(id, field.description, error)}
      className="h-40 w-full min-w-0 touch-none rounded-lg border border-input bg-white focus-visible:outline-2 focus-visible:outline-ring"
      onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onBlur={control.onBlur} />
    <Button type="button" size="sm" variant="outline" className="w-fit" disabled={field.disabled || !value} onClick={clear}>Clear signature</Button>
  </FieldFrame>;
}
