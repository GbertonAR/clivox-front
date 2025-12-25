// src/components/ui/toast-provider.tsx
"use client"

import * as React from "react"
import {
  ToastProvider as RadixToastProvider,
  ToastViewport
} from "@radix-ui/react-toast"
import { Toast } from "./toast"

const ToastContext = React.createContext<any>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<any[]>([])

  const addToast = (toast: any) => setToasts((prev) => [...prev, toast])
  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast: addToast, dismiss }}>
      <RadixToastProvider>
        {children}
        {toasts.map((t, i) => (
          <Toast key={t.id || i} {...t} />
        ))}
        <ToastViewport className="fixed bottom-0 right-0 p-4" />
      </RadixToastProvider>
    </ToastContext.Provider>
  )
}

export const useToastContext = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToastContext debe usarse dentro de <ToastProvider>")
  }
  return context
}
