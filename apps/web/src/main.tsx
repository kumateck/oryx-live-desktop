import { UpdateProvider } from "./shared/updates/update-provider";
import { StrictMode } from "react";
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

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");

reloadOnStaleBuild();
const router = createBrowserRouter(routes);
createRoot(root).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ThemeProvider>
        <TooltipProvider delayDuration={200}>
          <UpdateProvider><SessionProvider>
            <RouterProvider router={router} />
          </SessionProvider></UpdateProvider>
          <Toaster position="top-right" closeButton richColors />
        </TooltipProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);
