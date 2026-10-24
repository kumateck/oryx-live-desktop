import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { useMoveShelfStockMutation } from "../api/location-api";
import { useRacks } from "../hooks/use-racks";
import { availableToMove, moveProblems, moveRequest, moveUnit, type MoveSource } from "../lib/move-stock";
import { moveStockFormSchema, type MoveStockFormValues, type RackSummary } from "../schemas/rack-schema";

type Form = UseFormReturn<MoveStockFormValues>;
export const emptyMove = { quantity: Number.NaN, rack: null, shelf: null, note: "" };

/** One destination: how much goes on which shelf of which rack. Shared by every dialog that puts stock on shelves. */
export function MoveLine({ form, index, racks, unit, onRemove }: { form: Form; index: number; racks: readonly RackSummary[]; unit: string; onRemove: (() => void) | null }) {
  const rack = useWatch({ control: form.control, name: `moves.${index}.rack` });
  const loadRacks = useCallback<SelectLoader>(async (search) => {
    const term = search.trim().toLocaleLowerCase();
    return { options: racks.filter((item) => item.label.toLocaleLowerCase().includes(term))
      .map((item) => ({ value: item.id, label: item.label })), hasNext: false, hasPrevious: false };
  }, [racks]);
  const shelfOptions = useMemo(() => (racks.find((item) => item.id === rack?.value)?.shelves ?? []).map((shelf) => ({ value: shelf.id, label: shelf.label })), [racks, rack]);
  const shelf = useWatch({ control: form.control, name: `moves.${index}.shelf` });
  // A shelf chosen under another rack is not a shelf of this one.
  useEffect(() => {
    if (shelf && rack && racks.length > 0 && !shelfOptions.some((item) => item.value === shelf.value)) form.setValue(`moves.${index}.shelf`, null);
  }, [form, index, rack, racks.length, shelf, shelfOptions]);
  const fields = useMemo((): WizardField<MoveStockFormValues>[] => [
    { type: InputTypes.NUMBER, name: `moves.${index}.quantity`, label: `Quantity (${unit})`, required: true, min: 0 },
    { type: InputTypes.SELECT, name: `moves.${index}.rack`, label: "Rack", mode: "single", source: "async", loadOptions: loadRacks, debounceMs: 0, required: true, placeholder: "Select a rack", searchPlaceholder: "Search racks" },
    { type: InputTypes.SELECT, name: `moves.${index}.shelf`, label: "Shelf", mode: "single", source: "sync", options: shelfOptions, required: true,
      placeholder: !rack ? "Choose a rack first" : shelfOptions.length ? "Select a shelf" : "This rack has no shelves" },
    { type: InputTypes.TEXT, name: `moves.${index}.note`, label: "Note", placeholder: "Optional", className: "md:col-span-3" },
  ], [index, unit, loadRacks, shelfOptions, rack]);
  return <li className="space-y-2 rounded-md border p-3">
    <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">Destination {index + 1}</span>
      {onRemove ? <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove destination ${index + 1}`} onClick={onRemove}><Trash2 /></Button> : null}</div>
    <FormWizard form={form} fields={fields} className="md:grid-cols-3" />
  </li>;
}

/** Moves stock of one batch from the shelf it is on to one or more other shelves. */
export function MoveStockDialog({ source, onClose }: { source: MoveSource; onClose: () => void }) {
  const racks = useRacks(source.kind);
  const [move, mutation] = useMoveShelfStockMutation();
  const [message, setMessage] = useState("");
  const form = useForm<MoveStockFormValues>({ resolver: zodResolver(moveStockFormSchema), defaultValues: { moves: [emptyMove] } });
  const lines = useFieldArray({ control: form.control, name: "moves" });
  // Read here so the dialog re-renders, and its lines show their messages, when validation fails.
  const listError = form.formState.errors.moves?.root?.message ?? form.formState.errors.moves?.message;
  const unit = moveUnit(source);
  const available = availableToMove(source);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const problems = moveProblems(source, values.moves);
    for (const problem of problems) if (problem.index !== null && problem.field) form.setError(`moves.${problem.index}.${problem.field}`, { message: problem.message });
    const general = problems.find((problem) => problem.index === null);
    if (general) setMessage(general.message);
    if (problems.length > 0) return;
    const result = await move(moveRequest(source, values.moves));
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Stock moved");
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Move stock to another shelf</DialogTitle>
        <DialogDescription>Split the quantity over as many shelves as needed. What is not moved stays where it is.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <dl className="grid gap-x-8 gap-y-2 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-4">
            <div className="min-w-0 sm:col-span-2"><dt className="text-xs text-muted-foreground">Material</dt><dd className="break-words font-medium">{source.materialName}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Batch</dt><dd className="font-medium">{source.batchNumber ?? "–"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">On {source.shelfLabel ? `shelf ${source.shelfLabel}` : "the shelf"}</dt><dd className="font-medium">{formatQuantityNumber(available, "calculated")} {unit}</dd></div>
          </dl>
          {racks.error ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{racks.error}<Button type="button" size="sm" variant="outline" onClick={racks.retry}>Retry</Button></p> : null}
          {!racks.loading && !racks.error && racks.racks.length === 0 ? <p role="alert" className="text-sm">Your department has no racks for this kind of material.</p> : null}
          <ul className="space-y-2">{lines.fields.map((field, index) => <MoveLine key={field.id} form={form} index={index} racks={racks.racks} unit={unit}
            onRemove={lines.fields.length > 1 ? () => lines.remove(index) : null} />)}</ul>
          <Button type="button" size="sm" variant="outline" onClick={() => lines.append(emptyMove)}><Plus />Add another shelf</Button>
          {message || listError ? <p role="alert" className="text-sm text-destructive">{message || listError}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={mutation.isLoading} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isLoading || racks.loading}>{mutation.isLoading ? <><Spinner />Moving…</> : "Move stock"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
