import "./utils/silenceConsole";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { mockAuth } from "./lib/mock-auth";
import { createMockApiInterceptor } from "./lib/mock-api";
import "./api/axios";
import AppErrorBoundary from "./components/AppErrorBoundary";

// Enable mock mode in development
if (import.meta.env.DEV) {
  mockAuth.enableMockMode();
  createMockApiInterceptor();
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
