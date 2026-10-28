import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "../src/components/ui/sonner";
import { Dashboard } from "../src/routes/index";
import "../src/styles.css";

// GitHub Pages serves a static app. Mount the operational dashboard directly
// instead of invoking TanStack Start's SSR-specific route tree and root shell.
const element = document.getElementById("root");
if (!element) throw new Error("Root element is missing");

createRoot(element).render(
  <StrictMode>
    <Dashboard />
    <Toaster richColors position="top-right" />
  </StrictMode>,
);
