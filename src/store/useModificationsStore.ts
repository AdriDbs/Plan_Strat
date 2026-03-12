import { create } from 'zustand';
import { saveToStorage, loadFromStorage } from '../lib/storage';
import type { ModificationRecord } from '../types/data';

interface ModificationsStore {
  modifications: ModificationRecord[];
  addModification: (mod: Omit<ModificationRecord, 'id'>) => void;
  updateModification: (id: string, mod: Partial<ModificationRecord>) => void;
  deleteModification: (id: string) => void;
  setModifications: (mods: ModificationRecord[]) => void;
  clearAll: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const useModificationsStore = create<ModificationsStore>((set) => ({
  modifications: loadFromStorage<ModificationRecord[]>('pst_modifications', []),

  addModification: (mod) => {
    set(state => {
      const newMod: ModificationRecord = { ...mod, id: generateId() };
      const newMods = [...state.modifications, newMod];
      saveToStorage('pst_modifications', newMods);
      return { modifications: newMods };
    });
  },

  updateModification: (id, mod) => {
    set(state => {
      const newMods = state.modifications.map(m => m.id === id ? { ...m, ...mod } : m);
      saveToStorage('pst_modifications', newMods);
      return { modifications: newMods };
    });
  },

  deleteModification: (id) => {
    set(state => {
      const newMods = state.modifications.filter(m => m.id !== id);
      saveToStorage('pst_modifications', newMods);
      return { modifications: newMods };
    });
  },

  setModifications: (mods) => {
    saveToStorage('pst_modifications', mods);
    set({ modifications: mods });
  },

  clearAll: () => {
    saveToStorage('pst_modifications', []);
    set({ modifications: [] });
  },
}));
