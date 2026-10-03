import { collections } from "./lib/collections";
import { CollectionPanel } from "./components/collection-panel";

/** Public contract for dedicated collection screens with their own audit context. */
export function CollectionWorkspace({ collectionId, audit, addLabel }: { collectionId: string; audit: { module: string; subModule: string }; addLabel: string }) {
  const definition = collections.find((item) => item.id === collectionId);
  if (!definition) return <p role="alert">This collection is unavailable.</p>;
  return <CollectionPanel definition={definition} audit={audit} addLabel={addLabel} showHeading={false} />;
}
