import { configure } from "@testing-library/react";

// Lazy field chunks can take longer than the DOM library's 1s default when
// several suites run together; preserve the lazy loading behavior in tests.
configure({ asyncUtilTimeout: 5000 });

// jsdom has no layout, so it does not provide ResizeObserver; some controls (the switch) need it to exist.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
