import { configure } from "@testing-library/react";

// Lazy field chunks can take longer than the DOM library's 1s default when
// several suites run together; preserve the lazy loading behavior in tests.
configure({ asyncUtilTimeout: 5000 });
