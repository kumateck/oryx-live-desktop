import type {
  PlacementValidationOptions,
  ResolvedFormulaPlacement,
} from "./binding-contracts";
import { FormulaSourceType } from "./binding-contracts";
import type { FormulaIssue } from "./contracts";
import {
  FormulaDataType,
  FormulaIssueCode,
  FormulaValueShape,
} from "./contracts";
import { definitionError as error } from "./definition-helpers";

const findCycle = (graph: Map<string, string[]>): string[] | null => {
  const state = new Map<string, number>();
  for (const root of graph.keys()) state.set(root, 0);

  for (const root of graph.keys()) {
    if (state.get(root) !== 0) continue;
    const path: string[] = [root];
    const positions = new Map([[root, 0]]);
    const stack = [{ key: root, next: 0 }];
    state.set(root, 1);

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]!;
      const neighbours = graph.get(frame.key) ?? [];
      if (frame.next >= neighbours.length) {
        state.set(frame.key, 2);
        positions.delete(frame.key);
        path.pop();
        stack.pop();
        continue;
      }
      const neighbour = neighbours[frame.next++]!;
      if (state.get(neighbour) === 1) {
        const start = positions.get(neighbour) ?? 0;
        return [...path.slice(start), neighbour];
      }
      if (state.get(neighbour) === 0) {
        state.set(neighbour, 1);
        positions.set(neighbour, path.length);
        path.push(neighbour);
        stack.push({ key: neighbour, next: 0 });
      }
    }
  }
  return null;
};

export const validateFormulaDependencyGraph = (
  placements: ResolvedFormulaPlacement[],
  options: PlacementValidationOptions,
): FormulaIssue[] => {
  const issues: FormulaIssue[] = [];
  const byKey = new Map(
    placements.map((placement) => [placement.placementKey, placement]),
  );
  const graph = new Map<string, string[]>();
  let edgeCount = 0;

  for (const placement of placements) {
    const neighbours = new Set<string>();
    placement.bindings.forEach((binding, bindingIndex) => {
      binding.source.dependencies?.forEach((dependency, dependencyIndex) => {
        edgeCount += 1;
        const source = byKey.get(dependency.placementKey);
        const path = `placements[${placement.placementKey}].bindings[${bindingIndex}].source.dependencies[${dependencyIndex}]`;
        if (!source) {
          issues.push(
            error(
              FormulaIssueCode.UnknownDependency,
              path,
              `Formula placement "${dependency.placementKey}" does not exist.`,
            ),
          );
          return;
        }
        const sourceResult = source.definition.results.find(
          (result) => result.key === dependency.resultKey,
        );
        if (!sourceResult) {
          issues.push(
            error(
              FormulaIssueCode.UnknownResult,
              path,
              `Result "${dependency.resultKey}" does not exist on the source formula.`,
            ),
          );
          return;
        }
        if (
          binding.source.sourceType === FormulaSourceType.FormulaResult &&
          binding.source.dataType !== FormulaDataType.Decimal
        ) {
          issues.push(
            error(
              FormulaIssueCode.TypeMismatch,
              path,
              "Resolved dependency type does not match the source result.",
            ),
          );
        }
        if (
          binding.source.sourceType === FormulaSourceType.FormulaResult &&
          binding.source.valueShape !== FormulaValueShape.Scalar
        ) {
          issues.push(
            error(
              FormulaIssueCode.ShapeMismatch,
              path,
              "Resolved dependency shape does not match the source result.",
            ),
          );
        }
        if (
          binding.source.sourceType === FormulaSourceType.FormulaResult &&
          binding.source.unit !== sourceResult.unit
        ) {
          issues.push(
            error(
              FormulaIssueCode.UnitMismatch,
              path,
              "Resolved dependency unit does not match the source result.",
            ),
          );
        }
        neighbours.add(dependency.placementKey);
      });
    });
    graph.set(placement.placementKey, [...neighbours].sort());
  }

  if (edgeCount > options.maxDependencyEdges) {
    issues.push(
      error(
        FormulaIssueCode.ResourceLimit,
        "dependencyGraph",
        "Formula dependency edge limit exceeded.",
      ),
    );
  }
  const cycle = findCycle(graph);
  if (cycle) {
    issues.push(
      error(
        FormulaIssueCode.CyclicDependency,
        "dependencyGraph",
        `Formula dependency cycle: ${cycle.join(" -> ")}.`,
      ),
    );
  }
  return issues;
};
