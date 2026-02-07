import { create } from 'zustand'

interface SelectionState {
  selectedCount: number
  totalCount: number
  selectionTime: number
  setSelectionResult: (selected: number, total: number, time: number) => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedCount: 0,
  totalCount: 0,
  selectionTime: 0,
  setSelectionResult: (selected, total, time) => set({ selectedCount: selected, totalCount: total, selectionTime: time }),
}))
