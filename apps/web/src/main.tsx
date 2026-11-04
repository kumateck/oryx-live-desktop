import { UpdateProvider } from "./shared/updates/update-provider";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { routes } from "./routes/generated";
import { ThemeProvider } from "./shared/theme/theme-provider";
import { SessionProvider } from "./shared/auth/session-provider";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { GlobalErrorBoundary } from "./shared/errors/global-error-boundary";
import { reloadOnStaleBuild } from "./shared/errors/stale-build";
import "./styles.css";
import { isDesktopRenderer } from "./shared/workspace-tabs/is-desktop";
import { BootFallback } from "./shared/errors/global-error-boundary";

const DesktopApplication = lazy(() => import("./shared/workspace-tabs/desktop-application"));

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");

reloadOnStaleBuild();
const router = isDesktopRenderer() ? null : createBrowserRouter(routes);
createRoot(root).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ThemeProvider>
        <TooltipProvider delayDuration={200}>
          <UpdateProvider><SessionProvider>
            {router ? <RouterProvider router={router} /> : <Suspense fallback={<BootFallback />}><DesktopApplication /></Suspense>}
          </SessionProvider></UpdateProvider>
          <Toaster position="top-right" closeButton richColors />
        </TooltipProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);
