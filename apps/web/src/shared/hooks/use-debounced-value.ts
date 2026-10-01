import { useEffect, useState } from "react";

/** The value once it has stopped changing for `delayMs`, for search boxes that query the backend. */
export function useDebouncedValue<TValue>(value: TValue, delayMs = 300): TValue {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}
