import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { routes } from "./routes/generated";
import { ThemeProvider } from "./shared/theme/theme-provider";
import { SessionProvider } from "./shared/auth/session-provider";
import { Toaster } from "./components/ui/sonner";
import { GlobalErrorBoundary } from "./shared/errors/global-error-boundary";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");

const router = createBrowserRouter(routes);
createRoot(root).render(
  <StrictMode>
    <GlobalErrorBoundary><ThemeProvider><SessionProvider><RouterProvider router={router} /></SessionProvider><Toaster position="bottom-right" closeButton /></ThemeProvider></GlobalErrorBoundary>
  </StrictMode>,
);
