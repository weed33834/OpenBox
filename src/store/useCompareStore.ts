import { create } from "zustand";

// 对比列表上限：站点对比最多 4 个
export const MAX_COMPARE = 4;

interface CompareState {
  compareIds: string[];
  isOpen: boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isInCompare: (id: string) => boolean;
  setOpen: (v: boolean) => void;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  compareIds: [],
  isOpen: false,
  toggle: (id) =>
    set((state) => {
      if (state.compareIds.includes(id)) {
        return { compareIds: state.compareIds.filter((x) => x !== id) };
      }
      if (state.compareIds.length >= MAX_COMPARE) return state;
      return { compareIds: [...state.compareIds, id] };
    }),
  remove: (id) =>
    set((state) => ({ compareIds: state.compareIds.filter((x) => x !== id) })),
  clear: () => set({ compareIds: [] }),
  isInCompare: (id) => get().compareIds.includes(id),
  setOpen: (v) => set({ isOpen: v }),
}));
