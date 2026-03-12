import { create } from 'zustand';
import { buildConsolidation } from '../lib/consolidation';
import { buildProjections } from '../lib/projections';
import type { ConsolidatedRecord } from '../types/data';
import { useSourcesStore } from './useSourcesStore';
import { useReferentielsStore } from './useReferentielsStore';
import { useModificationsStore } from './useModificationsStore';
import { useHypothesesStore } from './useHypothesesStore';

interface DataStore {
  consolidation: ConsolidatedRecord[];
  projections: ConsolidatedRecord[];
  allData: ConsolidatedRecord[]; // consolidation + projections
  isCalculating: boolean;
  recalculate: () => void;
}

export const useDataStore = create<DataStore>((set) => ({
  consolidation: [],
  projections: [],
  allData: [],
  isCalculating: false,

  recalculate: () => {
    set({ isCalculating: true });
    // Use setTimeout to allow UI to update first
    setTimeout(() => {
      const sources = useSourcesStore.getState().sources;
      const modifications = useModificationsStore.getState().modifications;
      const referentiels = useReferentielsStore.getState().referentiels;
      const hypotheses = useHypothesesStore.getState().hypotheses;

      const consolidation = buildConsolidation(sources, modifications, referentiels);
      const projections = buildProjections(consolidation, hypotheses);
      const allData = [...consolidation, ...projections];

      set({ consolidation, projections, allData, isCalculating: false });
    }, 0);
  },
}));

// Auto-recalculate when stores change
let recalcTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleRecalc() {
  if (recalcTimeout) clearTimeout(recalcTimeout);
  recalcTimeout = setTimeout(() => {
    useDataStore.getState().recalculate();
  }, 100);
}

useSourcesStore.subscribe(scheduleRecalc);
useReferentielsStore.subscribe(scheduleRecalc);
useModificationsStore.subscribe(scheduleRecalc);
useHypothesesStore.subscribe(scheduleRecalc);

// Initial calculation
scheduleRecalc();
