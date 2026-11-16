import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { KeyFact } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { specificationRowsSchema, specificationSchema, type Specification } from "@/shared/specifications/specification-schema";
import { SpecificationPrintAction } from "@/shared/specifications/specification-print-action";
import { testStageLabel } from "@/shared/specifications/specification-rules";
import { useSpecificationTests } from "@/shared/specifications/use-specification-tests";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

export type SpecificationKind = "product" | "raw" | "packaging";
const audit = { module: "Reports", subModule: "Specification print" } as const;
const titles: Record<SpecificationKind, string> = { product: "Product specification", raw: "Material specification", packaging: "Material specification" };
const nouns: Record<SpecificationKind, string> = { product: "product", raw: "raw material", packaging: "packaging material" };

/** The specifications of one kind matching a search, newest first as the server lists them. */
function useSpecificationChoices(kind: SpecificationKind, search: string) {
  const args = { ...audit, page: 1, pageSize: 30, ...(search ? { searchQuery: search } : {}) };
  const products = analyticalApi.useGetApiV1ProductSpecificationsQuery(kind === "product" ? args : skipToken);
  const materials = analyticalApi.useGetApiV1MaterialSpecificationsQuery(kind === "product" ? skipToken : { ...args, materialKind: kind === "raw" ? 0 : 1 });
  const query = kind === "product" ? products : materials;
  const rows = useMemo(() => {
    const parsed = specificationRowsSchema.safeParse(query.currentData?.data ?? []);
    return parsed.success ? parsed.data : null;
  }, [query.currentData]);
  return { rows, loading: query.isFetching && !query.currentData, error: query.error ? apiErrorMessage(query.error) : rows === null ? "The server returned specifications the app could not read." : null, retry: () => void query.refetch() };
}

/** One chosen specification with its tests, and the same print as the specification page. */
function ChosenSpecification({ kind, id }: { kind: SpecificationKind; id: string }) {
  const product = analyticalApi.useGetApiV1ProductSpecificationsByIdQuery(kind === "product" ? { ...audit, id } : skipToken);
  const material = analyticalApi.useGetApiV1MaterialSpecificationsByIdQuery(kind === "product" ? skipToken : { ...audit, id });
  const query = kind === "product" ? product : material;
  const parsed = useMemo(() => query.currentData ? specificationSchema.safeParse(query.currentData) : null, [query.currentData]);
  const specification = parsed?.success ? parsed.data : null;
  const tests = useSpecificationTests(specification, kind === "product" ? "productSpecificationNumber" : "materialSpecificationNumber");
  if ((query.isFetching && !query.currentData) || tests.loading) return <Skeleton className="h-32 w-full" />;
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a specification the app could not read." : tests.error;
  if (error || !specification) return <div role="alert" className="space-y-2"><p className="text-sm">{error ?? "The specification could not be loaded."}</p>
    <Button variant="outline" onClick={() => { void query.refetch(); tests.retry(); }}>Retry</Button></div>;
  return <section aria-label={`Specification ${specification.number}`} className="space-y-4 rounded-lg border p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-base font-semibold">{specification.number}</h2><p className="text-sm text-muted-foreground">{specification.item?.name ?? "–"}</p></div>
      <SpecificationPrintAction kind={kind} title={titles[kind]} specification={specification} sections={tests.sections} />
    </div>
    <div className="grid gap-3 sm:grid-cols-4">
      <KeyFact label="Code" value={specification.item?.code ?? "–"} />
      <KeyFact label="Revision" value={specification.revisionNumber ?? "–"} />
      <KeyFact label="Status" value={specification.isVerified ? "Approved" : "Not approved"} />
      <KeyFact label="Tests" value={String(tests.sections.length)} />
    </div>
  </section>;
}


/** Specification report: choose one specification of this kind, then preview and print it. */
export function SpecificationReport({ kind }: { kind: SpecificationKind }) {
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const choices = useSpecificationChoices(kind, useDebouncedValue(search.trim(), 300));
  return <div className="grid gap-4 lg:grid-cols-[minmax(16rem,22rem)_1fr]">
    <section aria-label={`Choose a ${nouns[kind]} specification`} className="space-y-2">
      <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${nouns[kind]} or specification number`}
        aria-label={`Search ${nouns[kind]} specifications`} />
      {choices.loading ? <Skeleton className="h-40 w-full" /> : choices.error ? <div role="alert" className="space-y-2"><p className="text-sm">{choices.error}</p>
        <Button variant="outline" onClick={choices.retry}>Retry</Button></div>
        : !choices.rows?.length ? <p className="text-sm text-muted-foreground">No {nouns[kind]} specifications match.</p>
        : <ul className="max-h-[60vh] space-y-1 overflow-y-auto">{choices.rows.map((row) => <li key={row.id}>
          <Button variant={chosen === row.id ? "secondary" : "ghost"} className="h-auto w-full flex-col items-start gap-0 py-2 text-left" aria-pressed={chosen === row.id}
            onClick={() => setChosen(row.id)}>
            <span className="font-medium">{row.item?.name ?? "Unnamed"}</span>
            <span className="text-xs text-muted-foreground">{[row.number, row.item?.code, kind === "product" ? testStageLabel(row.testStage) : null].filter(Boolean).join(" · ")}</span>
          </Button></li>)}</ul>}
    </section>
    {chosen ? <ChosenSpecification key={chosen} kind={kind} id={chosen} />
      : <p className="self-center text-sm text-muted-foreground">Choose a specification to preview and print it.</p>}
  </div>;
}
