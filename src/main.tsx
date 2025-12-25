// import * as React from "react";
// import * as ReactDOM from "react-dom/client";
// import { initFluentIcons } from "./icons";
// initializeIcons();
// import App from "./App";
// import "./index.css";
// import { ToastProvider } from "@/components/ui/toast-provider";
// import { ThemeProvider } from "./components/ThemeContext";

import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ThemeProvider } from "./components/ThemeContext";
import { initFluentIcons } from "./icons";

// initFluentIcons();






ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ThemeProvider>
);
