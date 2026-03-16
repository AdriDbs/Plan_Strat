export type YearRange = 2026 | 2027 | 2028 | 2029 | 2030;

export interface TauxChargementParCategorie {
  2026: number;
  2027: number;
  2028: number;
  2029: number;
  2030: number;
}

export interface Hypotheses {
  anneeReference: number;
  tauxInflation: number;
  tauxChargement: {
    France: TauxChargementParCategorie;
    Pologne: TauxChargementParCategorie;
    'Nearshoring Autre': TauxChargementParCategorie;
    Offshoring: TauxChargementParCategorie;
    Outsourcing: TauxChargementParCategorie;
  };
  tauxMobilite: number;
  tauxEvolutionCharges: {
    [rep: string]: { [annee: number]: number };
  };
  indicateursETP: string[];
  indicateursExpansion: string[];
  entites: string[];
}

export const DEFAULT_HYPOTHESES: Hypotheses = {
  anneeReference: 2025,
  tauxInflation: 0.02,
  tauxChargement: {
    France:             { 2026: 0.02,  2027: 0.02,  2028: 0.02,  2029: 0.02,  2030: 0.02  },
    Pologne:            { 2026: 0.045, 2027: 0.045, 2028: 0.045, 2029: 0.045, 2030: 0.045 },
    'Nearshoring Autre':{ 2026: 0.02,  2027: 0.02,  2028: 0.02,  2029: 0.02,  2030: 0.02  },
    Offshoring:         { 2026: 0.02,  2027: 0.02,  2028: 0.02,  2029: 0.02,  2030: 0.02  },
    Outsourcing:        { 2026: 0.02,  2027: 0.02,  2028: 0.02,  2029: 0.02,  2030: 0.02  },
  },
  tauxMobilite: 0.03,
  tauxEvolutionCharges: {},
  indicateursETP: ['ETP FP', 'ETP M', 'Cout base', 'CU', 'Cout total'],
  indicateursExpansion: ['ETP FP', 'Cout total'],
  entites: ['OBI', 'France'],
};
