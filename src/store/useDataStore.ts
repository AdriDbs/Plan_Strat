import { create } from 'zustand';
import { buildConsolidation } from '../lib/consolidation';
import { buildProjections } from '../lib/projections';
import type { ConsolidatedRecord, ETPExterneRecord } from '../types/data';
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

      // Build etpExterne projected records (Année ≥ 2027) for buildProjections.
      // consolidation.ts already filters etp_externe to ≤ 2026, so these won't duplicate.
      const etpExterneProjected: ConsolidatedRecord[] = (sources.etp_externe as ETPExterneRecord[])
        .filter((r: ETPExterneRecord) => Number(r.Année) >= 2027)
        .map((r: ETPExterneRecord) => ({
          Type_indicateur: r.Type_indicateur != null ? String(r.Type_indicateur) : 'ETP_Workforce_Externe_FP',
          Entité: String(r.Entité ?? ''),
          Hub: String(r.Hub ?? ''),
          Process: String(r.Process ?? ''),
          CDR: String(r.CDR ?? ''),
          Projet: r.Projet != null ? String(r.Projet) : null,
          REP: null,
          Account: r.Account != null ? Number(r.Account) : null,
          Type_ETP: r.Type_ETP != null ? String(r.Type_ETP) : null,
          Code_ETP: r.Code_ETP != null ? String(r.Code_ETP) : null,
          Type_mouvement: null,
          Année: Number(r.Année),
          Total_ETP: r.Total_ETP != null ? Number(r.Total_ETP) : null,
          Total_Cout_KEUR: r.Total_Cout_KEUR != null ? Number(r.Total_Cout_KEUR) : null,
        }));

      const projections = buildProjections(consolidation, etpExterneProjected, hypotheses);
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
