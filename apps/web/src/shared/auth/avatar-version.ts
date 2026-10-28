import { useSyncExternalStore } from "react";

// The server stores a user's photo under the same name each time, so a new one would show the cached old one.
// Each confirmed upload bumps this number, which is added to the photo's address.
let version = 0;
const listeners = new Set<() => void>();

export function bumpAvatarVersion(): void {
  version += 1;
  for (const listener of listeners) listener();
}

export function useAvatarVersion(): number {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => version);
}
