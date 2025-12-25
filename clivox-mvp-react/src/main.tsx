import React from "react";
import ReactDOM from "react-dom/client";
import { initializeIcons } from '@fluentui/react/lib/Icons';
initializeIcons();
import App from "./App";
import "./index.css";
import { ToastProvider } from "@/components/ui/toast-provider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
