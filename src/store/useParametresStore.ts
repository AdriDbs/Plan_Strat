import { create } from 'zustand';
import { saveToStorage, loadFromStorage } from '../lib/storage';

export interface Parametres {
  anneeReference: number;
  anneesPrevision: number[];
  repsCompteResultat: string[];
  labelsREP: Record<string, string>;
  indicateursETP: string[];
  indicateursExpansion: string[];
  entites: string[];
}

const DEFAULT_REPS = [
  'REP1100', 'REP1395', 'REP1235', 'REP1236', 'REP1310', 'REP1311', 'REP1312', 'REP1313',
  'REP1331', 'REP1333', 'REP1334', 'REP1339', 'REP1374', 'REP1352', 'REP1355', 'REP1358',
  'REP1359', 'REP1361', 'REP1362', 'REP1363', 'REP1364', 'REP1365', 'REP1367', 'REP1369',
  'REP1341', 'REP1392', 'REP1396', 'REP2010',
];

const DEFAULT_PARAMETRES: Parametres = {
  anneeReference: 2025,
  anneesPrevision: [2024, 2025, 2026, 2027, 2028, 2029, 2030],
  repsCompteResultat: DEFAULT_REPS,
  labelsREP: {},
  indicateursETP: ['ETP FP', 'ETP M', 'Cout base', 'CU', 'Cout total'],
  indicateursExpansion: ['ETP FP', 'Cout total'],
  entites: ['OBI', 'France'],
};

interface ParametresStore {
  parametres: Parametres;
  updateParametres: (p: Partial<Parametres>) => void;
  resetParametres: () => void;
}

export const useParametresStore = create<ParametresStore>((set) => ({
  parametres: loadFromStorage<Parametres>('pst_parametres', DEFAULT_PARAMETRES),

  updateParametres: (p) => {
    set(state => {
      const updated = { ...state.parametres, ...p };
      saveToStorage('pst_parametres', updated);
      return { parametres: updated };
    });
  },

  resetParametres: () => {
    saveToStorage('pst_parametres', DEFAULT_PARAMETRES);
    set({ parametres: DEFAULT_PARAMETRES });
  },
}));
