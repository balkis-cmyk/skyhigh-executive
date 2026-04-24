"use client";

import { create } from "zustand";

export type ToastKind = "info" | "success" | "warning" | "negative" | "accent";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  detail?: string;
  /** Milliseconds before auto-dismiss. 0 = persistent. */
  duration?: number;
  createdAt: number;
}

interface ToastStore {
  toasts: Toast[];
  push(args: Omit<Toast, "id" | "createdAt">): string;
  dismiss(id: string): void;
  clearAll(): void;
}

export const useToasts = create<ToastStore>((set, get) => ({
  toasts: [],
  push: ({ kind, title, detail, duration = 4200 }) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const toast: Toast = {
      id,
      kind,
      title,
      detail,
      duration,
      createdAt: Date.now(),
    };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    if (duration > 0) {
      setTimeout(() => {
        // Only dismiss if it hasn't already been dismissed
        if (get().toasts.some((t) => t.id === id)) {
          get().dismiss(id);
        }
      }, duration);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearAll: () => set({ toasts: [] }),
}));

// Convenience helpers
export const toast = {
  info: (title: string, detail?: string) =>
    useToasts.getState().push({ kind: "info", title, detail }),
  success: (title: string, detail?: string) =>
    useToasts.getState().push({ kind: "success", title, detail }),
  warning: (title: string, detail?: string) =>
    useToasts.getState().push({ kind: "warning", title, detail }),
  negative: (title: string, detail?: string) =>
    useToasts.getState().push({ kind: "negative", title, detail }),
  accent: (title: string, detail?: string) =>
    useToasts.getState().push({ kind: "accent", title, detail }),
};
