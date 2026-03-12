import { create } from 'zustand';
import { saveToStorage, loadFromStorage } from '../lib/storage';
import type { Hypotheses } from '../types/hypotheses';
import { DEFAULT_HYPOTHESES } from '../types/hypotheses';

interface HypothesesStore {
  hypotheses: Hypotheses;
  updateHypotheses: (h: Partial<Hypotheses>) => void;
  resetHypotheses: () => void;
}

export const useHypothesesStore = create<HypothesesStore>((set) => ({
  hypotheses: loadFromStorage<Hypotheses>('pst_hypotheses', DEFAULT_HYPOTHESES),

  updateHypotheses: (h) => {
    set(state => {
      const updated = { ...state.hypotheses, ...h };
      saveToStorage('pst_hypotheses', updated);
      return { hypotheses: updated };
    });
  },

  resetHypotheses: () => {
    saveToStorage('pst_hypotheses', DEFAULT_HYPOTHESES);
    set({ hypotheses: DEFAULT_HYPOTHESES });
  },
}));
