import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, type?: ToastType) => void;
  remove: (id: number) => void;
}

let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, type = 'info') => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s: ToastState) => ({ toasts: s.toasts.filter((t: Toast) => t.id !== id) }));
    }, 3200);
  },
  remove: (id: number) => set((s: ToastState) => ({ toasts: s.toasts.filter((t: Toast) => t.id !== id) })),
}));
