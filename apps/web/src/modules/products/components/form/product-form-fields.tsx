import { useMemo, type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { ProductOptions } from "../../hooks/use-product-options";
import { divisionOptions } from "../../lib/product-form";
import type { ProductFormValues } from "../../schemas/product-form-schema";
import { QuantityHint } from "./quantity-hint";

type Fields = readonly WizardField<ProductFormValues>[];
const grid = "md:grid-cols-2 xl:grid-cols-3";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** The product form's sections. Used unchanged by create and by the edit Info tab. */
export function ProductFormFields({
  form,
  options,
  codeNote,
}: {
  form: UseFormReturn<ProductFormValues>;
  options: ProductOptions;
  codeNote?: ReactNode;
}) {
  const { categories, departments, units, equipment } = options;
  const information = useMemo<Fields>(
    () => [
      {
        type: "text",
        name: "name",
        label: "Product name",
        required: true,
        placeholder: "Enter product name",
      },
      {
        type: "text",
        name: "code",
        label: "Product code",
        required: true,
        placeholder: "Product code",
      },
      {
        type: "text",
        name: "genericName",
        label: "Generic name",
        placeholder: "Enter generic name",
      },
      {
        type: "select",
        name: "category",
        label: "Dosage",
        mode: "single",
        source: "sync",
        options: categories,
        required: true,
        placeholder: "Select category",
      },
      {
        type: "select",
        name: "department",
        label: "Department",
        mode: "single",
        source: "sync",
        options: departments,
        required: true,
        placeholder: "Select department",
      },
      {
        type: "select",
        name: "division",
        label: "Division",
        mode: "single",
        source: "sync",
        options: divisionOptions,
        required: true,
        placeholder: "Select division",
      },
    ],
    [categories, departments]
  );
  const quantities = useMemo<Fields>(
    () => [
      {
        type: "select",
        name: "baseUom",
        label: "Base unit",
        mode: "single",
        source: "sync",
        options: units,
        required: true,
        placeholder: "Select unit",
      },
      {
        type: "number",
        name: "baseQuantity",
        label: "Composition unit quantity",
        required: true,
        min: 0,
        placeholder: "Quantity per composition unit",
      },
      {
        type: "number",
        name: "fullBatchSize",
        label: "Full batch size",
        required: true,
        min: 0,
        placeholder: "Quantity per full batch",
      },
    ],
    [units]
  );
  const specifications = useMemo<Fields>(
    () => [
      {
        type: "number",
        name: "price",
        label: "Price",
        required: true,
        min: 0,
        placeholder: "Enter price",
      },
      {
        type: "text",
        name: "filledWeight",
        label: "Filled volume or weight",
        placeholder: "For example 100 ml",
      },
      {
        type: "text",
        name: "storageCondition",
        label: "Storage condition",
        placeholder: "Enter storage requirements",
      },
      {
        type: "text",
        name: "shelfLife",
        label: "Shelf life",
        placeholder: "For example 24 months",
      },
      {
        type: "text",
        name: "actionUse",
        label: "Action and use",
        placeholder: "Enter action and use",
      },
    ],
    []
  );
  const compliance = useMemo<Fields>(
    () => [
      {
        type: "select",
        name: "equipment",
        label: "Equipment",
        mode: "single",
        source: "sync",
        options: equipment,
        placeholder: "Select equipment",
      },
      {
        type: "text",
        name: "fdaRegistrationNumber",
        label: "FDA registration number",
        placeholder: "Enter FDA registration number",
      },
      {
        type: "text",
        name: "masterFormulaNumber",
        label: "Master formula number",
        placeholder: "Enter master formula number",
      },
      {
        type: "text",
        name: "documentNumber",
        label: "Document number",
        placeholder: "Enter document number",
      },
      {
        type: "number",
        name: "revisionNumber",
        label: "Revision number",
        min: 0,
        step: 1,
        placeholder: "Enter revision number",
      },
    ],
    [equipment]
  );
  const claims = useMemo<Fields>(
    () => [
      {
        type: "richtext",
        name: "description",
        label: "Label claims",
        placeholder: "Describe the product and its label claims",
        rows: 5,
      },
    ],
    []
  );

  return (
    <div className="min-w-0 space-y-4">
      <Section title="Product information">
        <FormWizard form={form} fields={information} className={grid} />
        {codeNote}
      </Section>
      <Section title="Units and quantities">
        <FormWizard form={form} fields={quantities} className={grid} />
        <QuantityHint control={form.control} unitSymbol={options.unitSymbol} />
      </Section>
      <Section title="Product specifications">
        <FormWizard form={form} fields={specifications} className={grid} />
      </Section>
      <Section title="Manufacturing and compliance">
        <FormWizard form={form} fields={compliance} className={grid} />
      </Section>
      <Section title="Label claims">
        <FormWizard form={form} fields={claims} />
      </Section>
    </div>
  );
}
