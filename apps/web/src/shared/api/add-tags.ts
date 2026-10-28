import type { ResultDescription } from "@reduxjs/toolkit/query";

type Tags<T extends string, R, A, E, M> = ResultDescription<T, R, A, E, M>;
function resolve<T extends string, R, A, E, M>(tags: Tags<T, R, A, E, M>, result: R | undefined, error: E | undefined, arg: A, meta: M) {
  return typeof tags === "function" ? tags(result, error, arg, meta) : tags;
}

/**
 * Adds a module's own cache tags to the tags an endpoint already has, instead of replacing them. Every generated endpoint
 * is tagged from its URL (docs/api-codegen.md, "Cache tags"); a module adds what that cannot know, such as a batch whose
 * test was assigned. Use in `enhanceEndpoints`: `name: (definition) => { definition.providesTags = addTags(definition.providesTags, extra); }`.
 */
export function addTags<T extends string, R, A, E, M>(base: Tags<T, R, A, E, M> | undefined, extra: Tags<T, R, A, E, M>): Tags<T, R, A, E, M> {
  if (!base) return extra;
  return (result, error, arg, meta) => [...resolve(base, result, error, arg, meta), ...resolve(extra, result, error, arg, meta)];
}
