import { create } from 'zustand';
import { saveToStorage, loadFromStorage } from '../lib/storage';
import type {
  SourcesState,
  SourceKey,
  SourceMetadata,
} from '../types/data';

interface SourcesStore {
  sources: SourcesState;
  metadata: Record<SourceKey, SourceMetadata | null>;
  setSource: (key: SourceKey, data: Record<string, unknown>[]) => void;
  clearSource: (key: SourceKey) => void;
  getMetadata: (key: SourceKey) => SourceMetadata | null;
}

const EMPTY_SOURCES: SourcesState = {
  budget_collector_charges: [],
  budget_collector_fte_fp: [],
  budget_collector_fte_m: [],
  alcyone_etp_fp: [],
  alcyone_cout_etp: [],
  alcyone_etp_moyen: [],
  expansion: [],
  etp_externe: [],
  besoin_ressources: [],
  charges_additionnelles: [],
  flux: [],
};

function loadAllSources(): SourcesState {
  const keys = Object.keys(EMPTY_SOURCES) as SourceKey[];
  const state = { ...EMPTY_SOURCES };
  for (const key of keys) {
    state[key] = loadFromStorage<never[]>(`pst_sources_${key}`, []);
  }
  return state;
}

function loadAllMetadata(): Record<SourceKey, SourceMetadata | null> {
  const meta = loadFromStorage<Record<SourceKey, SourceMetadata | null>>('pst_sources_metadata', {} as Record<SourceKey, SourceMetadata | null>);
  return meta;
}

export const useSourcesStore = create<SourcesStore>((set, get) => ({
  sources: loadAllSources(),
  metadata: loadAllMetadata(),

  setSource: (key: SourceKey, data: Record<string, unknown>[]) => {
    set(state => {
      const newSources = { ...state.sources, [key]: data };
      const persisted = saveToStorage(`pst_sources_${key}`, data);
      if (!persisted) {
        console.warn(`Source "${key}" not persisted (>4MB), kept in memory only.`);
      }
      const newMeta: Record<SourceKey, SourceMetadata | null> = {
        ...state.metadata,
        [key]: { lastUpdated: new Date().toISOString(), rowCount: data.length },
      };
      saveToStorage('pst_sources_metadata', newMeta);
      return { sources: newSources, metadata: newMeta };
    });
  },

  clearSource: (key: SourceKey) => {
    set(state => {
      const newSources = { ...state.sources, [key]: [] };
      saveToStorage(`pst_sources_${key}`, []);
      const newMeta: Record<SourceKey, SourceMetadata | null> = { ...state.metadata, [key]: null };
      saveToStorage('pst_sources_metadata', newMeta);
      return { sources: newSources, metadata: newMeta };
    });
  },

  getMetadata: (key: SourceKey) => {
    return get().metadata[key] ?? null;
  },
}));
